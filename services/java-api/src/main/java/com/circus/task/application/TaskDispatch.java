package com.circus.task.application;

import com.circus.messaging.TaskExecutionMessage;
import com.circus.task.api.dto.CreateTaskCommand;
import java.time.Instant;
import java.util.UUID;

/** 已持久化 pending 任务在事务提交后需要发布的执行快照。 */
public record TaskDispatch(UUID taskId, CreateTaskCommand command, Integer attempt, String traceId, Instant createdAt) {

    /** 将任务层快照转换成 Worker 约定的 Rabbit JSON；不在此处执行网络发送。 */
    public TaskExecutionMessage toExecutionMessage() {
        return new TaskExecutionMessage(null, taskId, command.taskType(), command.projectId(), command.episodeId(),
                command.shotId(), command.panelId(), attempt, traceId, createdAt, command.payload());
    }
}
