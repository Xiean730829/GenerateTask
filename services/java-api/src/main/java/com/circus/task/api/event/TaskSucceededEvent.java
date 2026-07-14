package com.circus.task.api.event;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

/** Worker 成功回写且状态机完成持久化后发出的生命周期事件，编排 handler 与 WS 均监听它。 */
public class TaskSucceededEvent extends TaskLifecycleEvent {

    public TaskSucceededEvent(Object source, UUID taskId, String taskType, UUID episodeId, Integer attempt,
                              JsonNode result, Instant updatedAt) {
        super(source, taskId, taskType, episodeId, attempt, "succeeded", 100, result, null, updatedAt);
    }
}
