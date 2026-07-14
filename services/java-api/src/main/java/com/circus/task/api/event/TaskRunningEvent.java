package com.circus.task.api.event;

import java.time.Instant;
import java.util.UUID;

/** Worker 已开始执行且状态已落库时发出的生命周期事件。 */
public class TaskRunningEvent extends TaskLifecycleEvent {

    public TaskRunningEvent(Object source, UUID taskId, String taskType, UUID episodeId, Integer attempt,
                            Integer progress, Instant updatedAt) {
        super(source, taskId, taskType, episodeId, attempt, "running", progress, null, null, updatedAt);
    }
}
