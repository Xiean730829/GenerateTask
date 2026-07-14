package com.circus.task.api.event;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.ApplicationEvent;

/**
 * task 状态完成持久化后的统一事件载体，供编排与 WS 订阅。
 * TaskCallbackService 的真实实现必须在有效状态变更并成功提交后发布它的子类，重复/旧回写不得发布。
 */
public abstract class TaskLifecycleEvent extends ApplicationEvent {

    private final UUID taskId;
    private final String taskType;
    private final UUID episodeId;
    private final Integer attempt;
    private final String status;
    private final Integer progress;
    private final JsonNode result;
    private final TaskErrorSnapshot error;
    private final Instant updatedAt;

    protected TaskLifecycleEvent(Object source, UUID taskId, String taskType, UUID episodeId, Integer attempt,
                                 String status, Integer progress, JsonNode result, TaskErrorSnapshot error,
                                 Instant updatedAt) {
        super(source);
        this.taskId = taskId;
        this.taskType = taskType;
        this.episodeId = episodeId;
        this.attempt = attempt;
        this.status = status;
        this.progress = progress;
        this.result = result;
        this.error = error;
        this.updatedAt = updatedAt;
    }

    public UUID taskId() { return taskId; }
    public String taskType() { return taskType; }
    public UUID episodeId() { return episodeId; }
    public Integer attempt() { return attempt; }
    public String status() { return status; }
    public Integer progress() { return progress; }
    public JsonNode result() { return result; }
    public TaskErrorSnapshot error() { return error; }
    public Instant updatedAt() { return updatedAt; }
}
