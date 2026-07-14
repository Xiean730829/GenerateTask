package com.circus.task.api.event;

import java.time.Instant;
import java.util.UUID;

/** Worker 失败回写且状态机完成持久化后发出的生命周期事件，不代表自动重试。 */
public class TaskFailedEvent extends TaskLifecycleEvent {

    public TaskFailedEvent(Object source, UUID taskId, String taskType, UUID episodeId, Integer attempt,
                           TaskErrorSnapshot error, Instant updatedAt) {
        super(source, taskId, taskType, episodeId, attempt, "failed", 100, null, error, updatedAt);
    }
}
