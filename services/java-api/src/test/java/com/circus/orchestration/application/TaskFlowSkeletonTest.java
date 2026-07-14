package com.circus.orchestration.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.circus.common.api.ApiEnvelope;
import com.circus.messaging.PublishConfirmHandler;
import com.circus.messaging.PublishOutcomeListener;
import com.circus.messaging.TaskPublication;
import com.circus.orchestration.api.NextStep;
import com.circus.orchestration.api.TaskResultHandler;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.api.event.TaskSucceededEvent;
import com.circus.task.api.websocket.EpisodeSocketRegistry;
import com.circus.task.api.websocket.TaskLifecycleWebSocketPublisher;
import com.circus.task.application.TaskCommandService;
import com.circus.task.application.TaskDispatch;
import com.circus.task.application.TaskDispatchRequestedEvent;
import com.circus.task.application.TaskStateStore;
import com.circus.task.internal.InternalTaskResultController;
import com.circus.task.internal.TaskCallbackService;
import com.circus.task.internal.TaskResult;
import com.circus.task.internal.TaskResultAcknowledgement;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

/**
 * G1 空跑验收：用内存替身贯通“创建任务 -> 发布确认 -> Python 回写 -> 领域事件 -> 编排 -> WS 快照”。
 * 它不测试真实 RabbitMQ/数据库；真实 broker 交给 TaskMessagingIT。
 */
class TaskFlowSkeletonTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /** @Test：证明各 seam 的最小闭环可组合，内容负责人可在不改基础设施的前提下接入业务 handler。 */
    @Test
    void noOpTaskFlowsFromCommandThroughCallbackEventDispatcherAndWebSocketSnapshot() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        CreateTaskCommand command = new CreateTaskCommand("__skeleton__", projectId, episodeId,
                null, null, objectMapper.createObjectNode().put("noop", true), "skeleton-key");
        AtomicReference<TaskDispatchRequestedEvent> dispatchEvent = new AtomicReference<>();
        TaskCommandService taskCommands = new TaskCommandService(new SkeletonTaskStateStore(),
                event -> dispatchEvent.set((TaskDispatchRequestedEvent) event));

        UUID taskId = taskCommands.create(command);
        TaskDispatch dispatch = dispatchEvent.get().dispatch();
        assertEquals(taskId, dispatch.taskId());
        assertEquals(0, dispatch.attempt());
        assertEquals("__skeleton__", dispatch.toExecutionMessage().taskType());

        AtomicBoolean queued = new AtomicBoolean();
        PublishConfirmHandler confirms = new PublishConfirmHandler(new PublishOutcomeListener() {
            @Override
            public void onPublished(TaskPublication publication) {
                queued.set(true);
            }

            @Override
            public void onPublishFailed(TaskPublication publication, String errorCode, String reason) {}
        });
        TaskPublication publication = new TaskPublication(UUID.randomUUID(), taskId, dispatch.attempt());
        confirms.confirm(confirms.track(publication), true, null);
        assertTrue(queued.get());

        AtomicReference<TaskSucceededEvent> callbackEvent = new AtomicReference<>();
        TaskCallbackService callbackService = result -> {
            callbackEvent.set(new TaskSucceededEvent(this, result.taskId(), "__skeleton__", result.episodeId(),
                    result.attempt(), result.result(), result.reportedAt()));
            return new TaskResultAcknowledgement(result.taskId(), false);
        };
        ObjectNode result = objectMapper.createObjectNode().put("accepted", true);
        ApiEnvelope<TaskResultAcknowledgement> acknowledgement = new InternalTaskResultController(callbackService)
                .reportResult(taskId, new TaskResult(publication.messageId(), taskId, episodeId, "succeeded", 0,
                        100, result, null, null, Instant.now()));
        assertFalse(acknowledgement.data().ignored());

        AtomicBoolean handlerCalled = new AtomicBoolean();
        TaskResultHandler handler = new TaskResultHandler() {
            @Override
            public String taskType() {
                return "__skeleton__";
            }

            @Override
            public Optional<NextStep> handle(TaskSucceededEvent event) {
                handlerCalled.set(true);
                return Optional.of(new NextStep.None());
            }
        };
        TaskCommandInterface noFurtherTask = new TaskCommandInterface() {
            @Override
            public UUID create(CreateTaskCommand nextCommand) {
                throw new AssertionError("No-op handler must not create a follow-up task");
            }

            @Override
            public void retry(UUID ignored) {}

            @Override
            public void cancel(UUID ignored) {}
        };
        new TaskResultDispatcher(new TaskResultHandlerRegistry(java.util.List.of(handler)),
                new PipelinePolicy(), noFurtherTask).onTaskSucceeded(callbackEvent.get());
        assertTrue(handlerCalled.get());

        RecordingSocketRegistry socketRegistry = new RecordingSocketRegistry();
        new TaskLifecycleWebSocketPublisher(socketRegistry, objectMapper).onTaskLifecycle(callbackEvent.get());
        assertNotNull(socketRegistry.payload.get());
        assertTrue(socketRegistry.payload.get().contains("\"type\":\"task.updated\""));
        assertTrue(socketRegistry.payload.get().contains(taskId.toString()));
    }

    /** 仅用于空跑测试，真实持久化适配器由 task 模块实现。 */
    private static final class SkeletonTaskStateStore implements TaskStateStore {
        @Override
        public Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType) {
            return Optional.empty();
        }

        @Override
        public TaskDispatch createPending(CreateTaskCommand command) {
            return new TaskDispatch(UUID.randomUUID(), command, 0, "skeleton-trace", Instant.now());
        }

        @Override
        public void retry(UUID taskId) {}

        @Override
        public void cancel(UUID taskId) {}
    }

    /** 截获广播 JSON，避免单测依赖网络连接或浏览器。 */
    private static final class RecordingSocketRegistry extends EpisodeSocketRegistry {
        private final AtomicReference<String> payload = new AtomicReference<>();

        @Override
        public void broadcast(UUID episodeId, String taskUpdate) {
            payload.set(taskUpdate);
        }
    }
}
