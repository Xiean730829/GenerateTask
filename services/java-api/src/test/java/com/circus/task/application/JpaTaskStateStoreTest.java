package com.circus.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class JpaTaskStateStoreTest {

    private static final Instant NOW = Instant.parse("2026-07-15T00:00:00Z");

    private final GenerationTaskRepository taskRepository = org.mockito.Mockito.mock(GenerationTaskRepository.class);
    private final GenerationTaskExecutionRepository executionRepository =
            org.mockito.Mockito.mock(GenerationTaskExecutionRepository.class);
    private final JpaTaskStateStore store = new JpaTaskStateStore(
            taskRepository,
            executionRepository,
            new ObjectMapper(),
            Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void createsPendingTaskAndItsImmutableExecutionInOneStoreOperation() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        CreateTaskCommand command = new CreateTaskCommand(
                "script.generate",
                projectId,
                episodeId,
                null,
                null,
                JsonNodeFactory.instance.objectNode().put("sourceText", "idea"),
                "request-001");
        when(taskRepository.findByOwnerUserIdAndIdempotencyOperationAndIdempotencyKey(
                JpaTaskStateStore.MS1_DEMO_OWNER_ID, "script.generate", "request-001"))
                .thenReturn(Optional.empty());

        TaskDispatch dispatch = store.createPending(command);

        assertThat(dispatch.taskId()).isNotNull();
        assertThat(dispatch.messageId()).isNotNull();
        assertThat(dispatch.attempt()).isZero();
        assertThat(dispatch.traceId()).isNotBlank();
        assertThat(dispatch.createdAt()).isEqualTo(NOW);

        ArgumentCaptor<GenerationTaskEntity> taskCaptor = ArgumentCaptor.forClass(GenerationTaskEntity.class);
        ArgumentCaptor<GenerationTaskExecutionEntity> executionCaptor =
                ArgumentCaptor.forClass(GenerationTaskExecutionEntity.class);
        verify(taskRepository).save(taskCaptor.capture());
        verify(executionRepository).save(executionCaptor.capture());

        GenerationTaskEntity task = taskCaptor.getValue();
        assertThat(task.id()).isEqualTo(dispatch.taskId());
        assertThat(task.projectId()).isEqualTo(projectId);
        assertThat(task.episodeId()).isEqualTo(episodeId);
        assertThat(task.ownerUserId()).isEqualTo(JpaTaskStateStore.MS1_DEMO_OWNER_ID);
        assertThat(task.status()).isEqualTo("pending");
        assertThat(task.attempt()).isZero();
        assertThat(task.idempotencyOperation()).isEqualTo("script.generate");

        GenerationTaskExecutionEntity execution = executionCaptor.getValue();
        assertThat(execution.messageId()).isEqualTo(dispatch.messageId());
        assertThat(execution.taskId()).isEqualTo(dispatch.taskId());
        assertThat(execution.attempt()).isZero();
        assertThat(execution.status()).isEqualTo("queued");
        assertThat(execution.payloadSnapshot().get("sourceText").asText()).isEqualTo("idea");
    }

    @Test
    void leavesIdempotencyScopeEmptyWhenTheRequestHasNoIdempotencyKey() {
        CreateTaskCommand command = new CreateTaskCommand(
                "shot.generate",
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                JsonNodeFactory.instance.objectNode().put("scriptId", "script-001"),
                null);

        TaskDispatch dispatch = store.createPending(command);

        ArgumentCaptor<GenerationTaskEntity> taskCaptor = ArgumentCaptor.forClass(GenerationTaskEntity.class);
        verify(taskRepository).save(taskCaptor.capture());
        GenerationTaskEntity task = taskCaptor.getValue();
        assertThat(task.id()).isEqualTo(dispatch.taskId());
        assertThat(task.idempotencyKey()).isNull();
        assertThat(task.idempotencyOperation()).isNull();
        assertThat(task.requestFingerprint()).isNull();
    }

    @Test
    void rejectsCreateWithoutEpisodeIdBeforeWritingEitherRow() {
        CreateTaskCommand command = new CreateTaskCommand(
                "script.generate",
                UUID.randomUUID(),
                null,
                null,
                null,
                JsonNodeFactory.instance.objectNode().put("sourceText", "idea"),
                null);

        assertThatThrownBy(() -> store.createPending(command))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("episodeId");

        org.mockito.Mockito.verifyNoInteractions(taskRepository, executionRepository);
    }

    @Test
    void createsANewExecutionAttemptWhenRetryingA_retryableFailure() {
        UUID taskId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "script.generate",
                "request-002",
                "script.generate",
                "fingerprint",
                "trace-old",
                NOW,
                3);
        task.markFailed(true, "TEMPORARY", "temporary worker failure", NOW);
        GenerationTaskExecutionEntity oldExecution = GenerationTaskExecutionEntity.queued(
                UUID.randomUUID(), taskId, 0, "trace-old",
                JsonNodeFactory.instance.objectNode().put("sourceText", "idea"), NOW);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(executionRepository.findByTaskIdAndAttempt(taskId, 0)).thenReturn(Optional.of(oldExecution));

        TaskDispatch dispatch = store.retry(taskId);

        assertThat(dispatch.taskId()).isEqualTo(taskId);
        assertThat(dispatch.attempt()).isEqualTo(1);
        assertThat(dispatch.messageId()).isNotEqualTo(oldExecution.messageId());
        assertThat(task.status()).isEqualTo("retrying");
        assertThat(task.retryCount()).isEqualTo(1);
        assertThat(task.attempt()).isEqualTo(1);
        verify(taskRepository).save(task);
        verify(executionRepository).save(any(GenerationTaskExecutionEntity.class));
    }

    @Test
    void republishesPendingPublishFailureWithSameTaskAndNewExecutionIdentity() {
        UUID taskId = UUID.randomUUID();
        UUID oldMessageId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "script.generate",
                "request-pending-retry",
                "script.generate",
                "fingerprint",
                "trace-old",
                NOW,
                3);
        task.markPublishFailed("TASK_PUBLISH_CONFIRM_FAILED", "broker rejected message", NOW);
        GenerationTaskExecutionEntity oldExecution = GenerationTaskExecutionEntity.queued(
                oldMessageId,
                taskId,
                0,
                "trace-old",
                JsonNodeFactory.instance.objectNode().put("sourceText", "idea"),
                NOW);
        oldExecution.markFailed("TASK_PUBLISH_CONFIRM_FAILED", "broker rejected message", NOW);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(executionRepository.findByTaskIdAndAttempt(taskId, 0)).thenReturn(Optional.of(oldExecution));

        TaskDispatch dispatch = store.republishPending(taskId);

        assertThat(dispatch.taskId()).isEqualTo(taskId);
        assertThat(dispatch.messageId()).isNotEqualTo(oldMessageId);
        assertThat(dispatch.attempt()).isEqualTo(1);
        assertThat(dispatch.command().payload()).isEqualTo(oldExecution.payloadSnapshot());
        assertThat(task.status()).isEqualTo("pending");
        assertThat(task.attempt()).isEqualTo(1);
        assertThat(task.retryCount()).isEqualTo(1);
        verify(taskRepository).save(task);
        verify(executionRepository).save(any(GenerationTaskExecutionEntity.class));
    }

    @Test
    void cancelsAPendingTaskWithoutCreatingAnotherExecution() {
        UUID taskId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "script.generate",
                null,
                null,
                null,
                "trace-cancel",
                NOW,
                3);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        store.cancel(taskId);

        assertThat(task.status()).isEqualTo("canceled");
        verify(taskRepository).save(task);
        org.mockito.Mockito.verifyNoInteractions(executionRepository);
    }
}
