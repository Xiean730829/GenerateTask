package com.circus.task.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.circus.task.api.dto.CreateTaskCommand;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class TaskCommandServiceTest {

    @Test
    void republishesTheNewExecutionAfterRetryStateIsPersisted() {
        UUID taskId = UUID.randomUUID();
        TaskDispatch retryDispatch = new TaskDispatch(
                UUID.randomUUID(),
                taskId,
                new CreateTaskCommand(
                        "script.generate",
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        null,
                        null,
                        JsonNodeFactory.instance.objectNode().put("sourceText", "idea"),
                        "request-003"),
                1,
                "trace-retry",
                Instant.parse("2026-07-15T00:00:00Z"));
        RecordingTaskStateStore stateStore = new RecordingTaskStateStore(retryDispatch);
        AtomicReference<TaskDispatchRequestedEvent> published = new AtomicReference<>();
        TaskCommandService service = new TaskCommandService(
                stateStore,
                event -> published.set((TaskDispatchRequestedEvent) event));

        service.retry(taskId);

        assertThat(stateStore.retriedTaskId).isEqualTo(taskId);
        assertThat(published.get().dispatch()).isEqualTo(retryDispatch);
    }

    private static final class RecordingTaskStateStore implements TaskStateStore {
        private final TaskDispatch retryDispatch;
        private UUID retriedTaskId;

        private RecordingTaskStateStore(TaskDispatch retryDispatch) {
            this.retryDispatch = retryDispatch;
        }

        @Override
        public Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType) {
            return Optional.empty();
        }

        @Override
        public TaskDispatch createPending(CreateTaskCommand command) {
            throw new AssertionError("create is not part of this test");
        }

        @Override
        public TaskDispatch retry(UUID taskId) {
            retriedTaskId = taskId;
            return retryDispatch;
        }

        @Override
        public TaskDispatch republishPending(UUID taskId) {
            throw new AssertionError("pending recovery is not part of this test");
        }

        @Override
        public void cancel(UUID taskId) {
            throw new AssertionError("cancel is not part of this test");
        }
    }
}
