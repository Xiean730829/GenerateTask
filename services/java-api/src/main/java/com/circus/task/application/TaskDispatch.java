package com.circus.task.application;

import com.circus.messaging.TaskExecutionMessage;
import com.circus.task.api.dto.CreateTaskCommand;
import java.time.Instant;
import java.util.UUID;

/**
 * 已持久化 pending 任务在事务提交后需要发布的执行快照。
 * messageId 必须由创建 execution 的事务预先分配，发布器只负责发送，不能重新生成派发身份。
 */
public record TaskDispatch(UUID messageId, UUID taskId, CreateTaskCommand command, Integer attempt,
                           String traceId, Instant createdAt) {

    /** 将任务层快照转换成 Worker 约定的 Rabbit JSON；不在此处执行网络发送。 */
    public TaskExecutionMessage toExecutionMessage() {
        return new TaskExecutionMessage(messageId, taskId, command.taskType(), command.projectId(), command.episodeId(),
                command.shotId(), command.panelId(), attempt, traceId, createdAt, command.payload());
    }
}
