package com.circus.task.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.circus.task.api.event.TaskFailedEvent;
import com.circus.task.api.event.TaskRunningEvent;
import com.circus.task.api.event.TaskSucceededEvent;
import com.circus.task.application.JpaTaskStateStore;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.ApplicationEventPublisher;

class GenerationTaskCallbackServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-15T00:00:00Z");

    private final GenerationTaskRepository taskRepository = Mockito.mock(GenerationTaskRepository.class);
    private final GenerationTaskExecutionRepository executionRepository =
            Mockito.mock(GenerationTaskExecutionRepository.class);
    private final ApplicationEventPublisher eventPublisher = Mockito.mock(ApplicationEventPublisher.class);
    private final GenerationTaskCallbackService service = new GenerationTaskCallbackService(
            taskRepository,
            executionRepository,
            eventPublisher,
            Clock.fixed(NOW, ZoneOffset.UTC));

    @BeforeEach
    void resetMocks() {
        Mockito.reset(taskRepository, executionRepository, eventPublisher);
    }

    @Test
    void acceptsRunningCallbackAndPublishesRunningEvent() {
        Fixture fixture = queuedFixture(0);
        when(executionRepository.findById(fixture.messageId())).thenReturn(Optional.of(fixture.execution()));
        when(taskRepository.findById(fixture.taskId())).thenReturn(Optional.of(fixture.task()));

        TaskResultAcknowledgement acknowledgement = service.handle(
                new TaskResult(fixture.messageId(), fixture.taskId(), fixture.episodeId(),
                        "running", 0, 25, null, null, null, NOW));

        assertThat(acknowledgement.ignored()).isFalse();
        assertThat(fixture.task().status()).isEqualTo("running");
        assertThat(fixture.task().progress()).isEqualTo(25);
        assertThat(fixture.execution().status()).isEqualTo("running");
        verify(taskRepository).save(fixture.task());
        verify(executionRepository).save(fixture.execution());
        verify(eventPublisher).publishEvent(any(TaskRunningEvent.class));
    }

    @Test
    void acceptsSucceededCallbackAndIgnoresDuplicateTerminalCallback() {
        Fixture fixture = runningFixture(0);
        when(executionRepository.findById(fixture.messageId())).thenReturn(Optional.of(fixture.execution()));
        when(taskRepository.findById(fixture.taskId())).thenReturn(Optional.of(fixture.task()));
        TaskResult result = new TaskResult(fixture.messageId(), fixture.taskId(), fixture.episodeId(),
                "succeeded", 0, 100, JsonNodeFactory.instance.objectNode().put("scriptId", "script-1"),
                null, null, NOW);

        assertThat(service.handle(result).ignored()).isFalse();
        assertThat(service.handle(result).ignored()).isTrue();

        assertThat(fixture.task().status()).isEqualTo("succeeded");
        assertThat(fixture.task().progress()).isEqualTo(100);
        assertThat(fixture.execution().status()).isEqualTo("succeeded");
        verify(eventPublisher).publishEvent(any(TaskSucceededEvent.class));
        verify(taskRepository).save(fixture.task());
        verify(executionRepository).save(fixture.execution());
    }

    @Test
    void acceptsFailedCallbackAndPublishesRetryableErrorSnapshot() {
        Fixture fixture = runningFixture(0);
        when(executionRepository.findById(fixture.messageId())).thenReturn(Optional.of(fixture.execution()));
        when(taskRepository.findById(fixture.taskId())).thenReturn(Optional.of(fixture.task()));

        TaskResultAcknowledgement acknowledgement = service.handle(
                new TaskResult(fixture.messageId(), fixture.taskId(), fixture.episodeId(),
                        "failed", 0, 100, null,
                        new TaskResultError("PYTHON_TIMEOUT", "worker timed out", true),
                        null, NOW));

        assertThat(acknowledgement.ignored()).isFalse();
        assertThat(fixture.task().status()).isEqualTo("failed");
        assertThat(fixture.task().retryable()).isTrue();
        assertThat(fixture.execution().status()).isEqualTo("failed");
        verify(eventPublisher).publishEvent(any(TaskFailedEvent.class));
    }

    @Test
    void ignoresUnknownMessageAndMismatchedEpisodeWithoutChangingState() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        when(executionRepository.findById(messageId)).thenReturn(Optional.empty());

        TaskResultAcknowledgement unknown = service.handle(new TaskResult(
                messageId, taskId, UUID.randomUUID(), "running", 0, 10, null, null, null, NOW));

        assertThat(unknown.ignored()).isTrue();
        verify(taskRepository, never()).findById(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    private Fixture queuedFixture(int attempt) {
        UUID taskId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId, UUID.randomUUID(), episodeId, null, null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID, "script.generate", null, null,
                null, "trace", NOW, 3);
        task.markQueued(NOW);
        GenerationTaskExecutionEntity execution = GenerationTaskExecutionEntity.queued(
                messageId, taskId, attempt, "trace",
                JsonNodeFactory.instance.objectNode().put("sourceText", "idea"), NOW);
        execution.markPublished(NOW);
        return new Fixture(taskId, episodeId, messageId, task, execution);
    }

    private Fixture runningFixture(int attempt) {
        Fixture fixture = queuedFixture(attempt);
        fixture.task().markRunning(25, NOW);
        fixture.execution().markRunning(NOW);
        return fixture;
    }

    private record Fixture(UUID taskId, UUID episodeId, UUID messageId,
                           GenerationTaskEntity task, GenerationTaskExecutionEntity execution) {}
}
