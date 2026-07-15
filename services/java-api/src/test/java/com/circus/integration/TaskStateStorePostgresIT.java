package com.circus.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.circus.task.application.JpaTaskStateStore;
import com.circus.task.application.TaskDispatch;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real PostgreSQL coverage for the task owner. Mockito tests cover branch rules;
 * this class proves Flyway constraints and JPA writes agree with those rules.
 */
@SpringBootTest
@ActiveProfiles("integration")
class TaskStateStorePostgresIT {

    @Autowired
    private JpaTaskStateStore store;

    @Autowired
    private GenerationTaskRepository taskRepository;

    @Autowired
    private GenerationTaskExecutionRepository executionRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void createsRetriesRepublishesPendingAndCancelsAgainstPostgres() {
        Scope scope = seedScope();
        CreateTaskCommand command = command(scope, "script.generate", "request-postgres-1");

        TaskDispatch first = store.createPending(command);

        GenerationTaskEntity created = taskRepository.findById(first.taskId()).orElseThrow();
        GenerationTaskExecutionEntity firstExecution = executionRepository.findById(first.messageId()).orElseThrow();
        assertThat(created.status()).isEqualTo("pending");
        assertThat(created.episodeId()).isEqualTo(scope.episodeId());
        assertThat(firstExecution.taskId()).isEqualTo(first.taskId());
        assertThat(firstExecution.attempt()).isZero();

        created.markPublishFailed("TASK_PUBLISH_CONFIRM_FAILED", "broker rejected", first.createdAt());
        firstExecution.markFailed("TASK_PUBLISH_CONFIRM_FAILED", "broker rejected", first.createdAt());
        taskRepository.saveAndFlush(created);
        executionRepository.saveAndFlush(firstExecution);

        TaskDispatch recovered = store.republishPending(first.taskId());
        assertThat(recovered.taskId()).isEqualTo(first.taskId());
        assertThat(recovered.messageId()).isNotEqualTo(first.messageId());
        assertThat(recovered.attempt()).isEqualTo(1);
        assertThat(executionRepository.findByTaskIdAndAttempt(first.taskId(), 1)).isPresent();

        GenerationTaskEntity retryable = taskRepository.findById(first.taskId()).orElseThrow();
        retryable.markFailed(true, "PYTHON_TIMEOUT", "worker timed out", recovered.createdAt());
        taskRepository.saveAndFlush(retryable);
        TaskDispatch retry = store.retry(first.taskId());
        assertThat(retry.taskId()).isEqualTo(first.taskId());
        assertThat(retry.attempt()).isEqualTo(2);
        assertThat(executionRepository.findByTaskIdAndAttempt(first.taskId(), 2)).isPresent();

        Scope cancelScope = seedScope();
        TaskDispatch cancelDispatch = store.createPending(command(cancelScope, "shot.generate", null));
        store.cancel(cancelDispatch.taskId());
        assertThat(taskRepository.findById(cancelDispatch.taskId()).orElseThrow().status())
                .isEqualTo("canceled");
    }

    @Test
    @Transactional
    void rejectsDuplicateTaskAttemptAtDatabaseBoundary() {
        Scope scope = seedScope();
        TaskDispatch dispatch = store.createPending(command(scope, "script.generate", "request-postgres-2"));
        entityManager.flush();
        entityManager.clear();

        GenerationTaskExecutionEntity duplicateAttempt = GenerationTaskExecutionEntity.queued(
                UUID.randomUUID(), dispatch.taskId(), 0, "duplicate-trace",
                JsonNodeFactory.instance.objectNode().put("sourceText", "duplicate"), dispatch.createdAt());

        assertThatThrownBy(() -> executionRepository.saveAndFlush(duplicateAttempt))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @Transactional
    void rejectsDuplicateMessageIdentityAtDatabaseBoundary() {
        Scope firstScope = seedScope();
        Scope secondScope = seedScope();
        TaskDispatch first = store.createPending(command(firstScope, "script.generate", "request-postgres-3"));
        TaskDispatch second = store.createPending(command(secondScope, "shot.generate", "request-postgres-4"));
        entityManager.flush();

        assertThatThrownBy(() -> jdbcTemplate.update(
                "insert into generation_task_execution "
                        + "(message_id, task_id, attempt, trace_id, payload_snapshot, status, created_at, updated_at) "
                        + "values (?, ?, 1, ?, '{}'::jsonb, 'queued', now(), now())",
                first.messageId(), second.taskId(), "duplicate-message-trace"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Scope seedScope() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        jdbcTemplate.update(
                "insert into project (id, owner_user_id, name, project_type, stage, default_episode_id) "
                        + "values (?, ?, ?, 'single_episode', 'material', ?)",
                projectId, JpaTaskStateStore.MS1_DEMO_OWNER_ID, "integration-project", episodeId);
        jdbcTemplate.update(
                "insert into episode (id, project_id, title, order_index, status) values (?, ?, ?, 0, 'created')",
                episodeId, projectId, "integration-episode");
        return new Scope(projectId, episodeId);
    }

    private CreateTaskCommand command(Scope scope, String taskType, String idempotencyKey) {
        return new CreateTaskCommand(
                taskType,
                scope.projectId(),
                scope.episodeId(),
                null,
                null,
                JsonNodeFactory.instance.objectNode().put("sourceText", "integration"),
                idempotencyKey);
    }

    private record Scope(UUID projectId, UUID episodeId) {}
}
