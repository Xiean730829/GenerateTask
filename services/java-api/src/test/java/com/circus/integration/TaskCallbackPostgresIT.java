package com.circus.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.circus.messaging.TaskPublication;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.api.event.TaskRunningEvent;
import com.circus.task.api.event.TaskSucceededEvent;
import com.circus.task.application.JpaTaskStateStore;
import com.circus.task.application.TaskDispatch;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.circus.task.internal.GenerationTaskCallbackService;
import com.circus.task.internal.TaskResult;
import com.circus.task.internal.TaskResultAcknowledgement;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

/** Real database callback lifecycle coverage, including duplicate terminal reports. */
@SpringBootTest
@ActiveProfiles("integration")
@RecordApplicationEvents
class TaskCallbackPostgresIT {

    @Autowired
    private JpaTaskStateStore store;

    @Autowired
    private GenerationTaskRepository taskRepository;

    @Autowired
    private GenerationTaskExecutionRepository executionRepository;

    @Autowired
    private com.circus.task.application.TaskPublishOutcomeListener publishOutcomeListener;

    @Autowired
    private GenerationTaskCallbackService callbackService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ApplicationEvents applicationEvents;

    @Test
    @Transactional
    void persistsWorkerLifecycleAndPublishesTerminalEventOnce() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        jdbcTemplate.update(
                "insert into project (id, owner_user_id, name, project_type, stage, default_episode_id) "
                        + "values (?, ?, ?, 'single_episode', 'material', ?)",
                projectId, JpaTaskStateStore.MS1_DEMO_OWNER_ID, "callback-project", episodeId);
        jdbcTemplate.update(
                "insert into episode (id, project_id, title, order_index, status) values (?, ?, ?, 0, 'created')",
                episodeId, projectId, "callback-episode");

        TaskDispatch dispatch = store.createPending(new CreateTaskCommand(
                "script.generate",
                projectId,
                episodeId,
                null,
                null,
                JsonNodeFactory.instance.objectNode().put("sourceText", "callback"),
                "callback-idempotency"));
        publishOutcomeListener.onPublished(new TaskPublication(dispatch.messageId(), dispatch.taskId(), 0));

        TaskResult running = new TaskResult(
                dispatch.messageId(), dispatch.taskId(), episodeId, "running", 0, 25,
                null, null, null, Instant.now());
        TaskResult succeeded = new TaskResult(
                dispatch.messageId(), dispatch.taskId(), episodeId, "succeeded", 0, 100,
                JsonNodeFactory.instance.objectNode().put("scriptId", "script-callback"),
                null, null, Instant.now());

        assertThat(callbackService.handle(running).ignored()).isFalse();
        TaskResultAcknowledgement firstTerminal = callbackService.handle(succeeded);
        TaskResultAcknowledgement duplicateTerminal = callbackService.handle(succeeded);

        assertThat(firstTerminal.ignored()).isFalse();
        assertThat(duplicateTerminal.ignored()).isTrue();
        GenerationTaskEntity task = taskRepository.findById(dispatch.taskId()).orElseThrow();
        GenerationTaskExecutionEntity execution = executionRepository.findById(dispatch.messageId()).orElseThrow();
        assertThat(task.status()).isEqualTo("succeeded");
        assertThat(task.progress()).isEqualTo(100);
        assertThat(execution.status()).isEqualTo("succeeded");
        assertThat(applicationEvents.stream(TaskRunningEvent.class).count()).isEqualTo(1);
        assertThat(applicationEvents.stream(TaskSucceededEvent.class).count()).isEqualTo(1);
    }
}
