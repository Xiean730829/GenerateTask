package com.circus.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.circus.messaging.TaskPublication;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TaskPublishOutcomeListenerTest {

    private static final Instant NOW = Instant.parse("2026-07-15T00:00:00Z");

    private final GenerationTaskRepository taskRepository =
            org.mockito.Mockito.mock(GenerationTaskRepository.class);
    private final GenerationTaskExecutionRepository executionRepository =
            org.mockito.Mockito.mock(GenerationTaskExecutionRepository.class);
    private final TaskPublishOutcomeListener listener = new TaskPublishOutcomeListener(
            taskRepository,
            executionRepository,
            Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void publishAckMovesPendingTaskAndExecutionToQueued() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = pendingTask(taskId);
        GenerationTaskExecutionEntity execution = execution(taskId, messageId, 0);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        listener.onPublished(new TaskPublication(messageId, taskId, 0));

        assertThat(task.status()).isEqualTo("queued");
        assertThat(execution.status()).isEqualTo("queued");
        assertThat(execution.publishedAt()).isEqualTo(NOW);
        verify(taskRepository).save(task);
        verify(executionRepository).save(execution);
    }

    @Test
    void initialPublishFailureKeepsTaskPendingAndMarksExecutionFailed() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = pendingTask(taskId);
        GenerationTaskExecutionEntity execution = execution(taskId, messageId, 0);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        listener.onPublishFailed(
                new TaskPublication(messageId, taskId, 0),
                "TASK_PUBLISH_CONFIRM_FAILED",
                "broker rejected message");

        assertThat(task.status()).isEqualTo("pending");
        assertThat(task.retryable()).isTrue();
        assertThat(execution.status()).isEqualTo("failed");
        verify(taskRepository).save(task);
        verify(executionRepository).save(execution);
    }

    @Test
    void retryPublishFailureMovesRetryingTaskToFailed() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = pendingTask(taskId);
        task.markFailed(true, "TEMPORARY", "worker failure", NOW);
        task.beginRetry("trace-retry", NOW);
        GenerationTaskExecutionEntity execution = execution(taskId, messageId, 1);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        listener.onPublishFailed(
                new TaskPublication(messageId, taskId, 1),
                "TASK_PUBLISH_CONFIRM_FAILED",
                "broker rejected retry");

        assertThat(task.status()).isEqualTo("failed");
        assertThat(task.retryable()).isTrue();
        assertThat(execution.status()).isEqualTo("failed");
        verify(taskRepository).save(task);
        verify(executionRepository).save(execution);
    }

    @Test
    void ignoresUnknownOrMismatchedPublicationIdentityWithoutWriting() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskExecutionEntity execution = execution(UUID.randomUUID(), messageId, 0);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));

        listener.onPublished(new TaskPublication(messageId, taskId, 0));

        verifyNoInteractions(taskRepository);
        verify(executionRepository).findById(messageId);
        org.mockito.Mockito.verifyNoMoreInteractions(executionRepository);
    }

    @Test
    void ignoresConfirmationForAlreadyTerminalTask() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = pendingTask(taskId);
        task.markFailed(false, "FINAL", "permanent failure", NOW);
        task.cancel(NOW);
        GenerationTaskExecutionEntity execution = execution(taskId, messageId, 0);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        listener.onPublished(new TaskPublication(messageId, taskId, 0));

        assertThat(task.status()).isEqualTo("canceled");
        assertThat(execution.status()).isEqualTo("queued");
        verify(taskRepository).findById(taskId);
        org.mockito.Mockito.verifyNoMoreInteractions(taskRepository);
        verify(executionRepository).findById(messageId);
        org.mockito.Mockito.verifyNoMoreInteractions(executionRepository);
    }

    @Test
    void ignoresLateAckAfterTheSameExecutionWasMarkedFailed() {
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        GenerationTaskEntity task = pendingTask(taskId);
        GenerationTaskExecutionEntity execution = execution(taskId, messageId, 0);
        execution.markFailed("TASK_PUBLISH_CONFIRM_FAILED", "broker rejected message", NOW);
        when(executionRepository.findById(messageId)).thenReturn(Optional.of(execution));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        listener.onPublished(new TaskPublication(messageId, taskId, 0));

        assertThat(task.status()).isEqualTo("pending");
        assertThat(execution.status()).isEqualTo("failed");
        verify(executionRepository).findById(messageId);
        verify(taskRepository).findById(taskId);
        org.mockito.Mockito.verifyNoMoreInteractions(taskRepository, executionRepository);
    }

    private GenerationTaskEntity pendingTask(UUID taskId) {
        return GenerationTaskEntity.pending(
                taskId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "script.generate",
                "request-001",
                "script.generate",
                "fingerprint",
                "trace-001",
                NOW,
                3);
    }

    private GenerationTaskExecutionEntity execution(UUID taskId, UUID messageId, int attempt) {
        return GenerationTaskExecutionEntity.queued(
                messageId,
                taskId,
                attempt,
                "trace-001",
                com.fasterxml.jackson.databind.node.JsonNodeFactory.instance
                        .objectNode()
                        .put("sourceText", "idea"),
                NOW);
    }
}
