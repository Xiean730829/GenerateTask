package com.circus.task.api.websocket;

import com.circus.task.api.event.TaskErrorSnapshot;
import com.circus.task.api.event.TaskLifecycleEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** 只消费已提交的生命周期事件，将其转换成前端约定的 task.updated JSON。 */
// @Component：注册为领域事件监听器，而非 HTTP 控制器的直接依赖。
@Component
public class TaskLifecycleWebSocketPublisher {

    private final EpisodeSocketRegistry socketRegistry;
    private final ObjectMapper objectMapper;

    public TaskLifecycleWebSocketPublisher(EpisodeSocketRegistry socketRegistry, ObjectMapper objectMapper) {
        this.socketRegistry = socketRegistry;
        this.objectMapper = objectMapper;
    }

    /** 数据库状态提交成功后再广播，避免前端看到尚未持久化的任务状态。 */
    // @TransactionalEventListener(AFTER_COMMIT)：回滚的状态变更不会推送给前端。
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskLifecycle(TaskLifecycleEvent event) {
        ObjectNode envelope = objectMapper.createObjectNode();
        ObjectNode data = envelope.put("type", "task.updated").putObject("data");
        data.put("taskId", event.taskId().toString());
        data.put("episodeId", event.episodeId().toString());
        data.put("taskType", event.taskType());
        data.put("status", event.status());
        data.put("progress", event.progress());
        data.set("result", event.result() == null ? objectMapper.nullNode() : event.result());
        data.set("error", errorNode(event.error()));
        data.put("updatedAt", event.updatedAt().toString());
        socketRegistry.broadcast(event.episodeId(), envelope.toString());
    }

    private ObjectNode errorNode(TaskErrorSnapshot error) {
        if (error == null) {
            return null;
        }
        ObjectNode node = objectMapper.createObjectNode();
        node.put("code", error.code());
        node.put("message", error.message());
        node.put("retryable", error.retryable());
        return node;
    }
}
