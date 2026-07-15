package com.circus.task.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 一次不可变派发的持久化记录：messageId 是 Worker 回写的唯一身份，taskId + attempt 保证一次重试只有一次派发。
 * GenerationTaskEntity 仍只表达“当前任务状态”，不要把重试历史字段继续塞进其中。
 */
// @Entity：声明这是 JPA 管理的数据库实体。
@Entity
// @Table：明确映射 V5 创建的 execution 历史表。
@Table(name = "generation_task_execution")
public class GenerationTaskExecutionEntity {

    // @Id：message_id 是本次派发的全局主键，也是 Python 回写时携带的 messageId。
    @Id
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "attempt", nullable = false)
    private Integer attempt;

    @Column(name = "trace_id", length = 128)
    private String traceId;

    // @JdbcTypeCode(JSON)：把不可变任务输入快照映射为 PostgreSQL jsonb。
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_snapshot", nullable = false, columnDefinition = "jsonb")
    private JsonNode payloadSnapshot;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    // @JdbcTypeCode(JSON)：把 Worker 成功结果映射为 PostgreSQL jsonb。
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private JsonNode resultJson;

    @Column(name = "error_code", length = 128)
    private String errorCode;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected GenerationTaskExecutionEntity() {}

    public static GenerationTaskExecutionEntity queued(
            UUID messageId,
            UUID taskId,
            int attempt,
            String traceId,
            JsonNode payloadSnapshot,
            Instant now) {
        GenerationTaskExecutionEntity execution = new GenerationTaskExecutionEntity();
        execution.messageId = messageId;
        execution.taskId = taskId;
        execution.attempt = attempt;
        execution.traceId = traceId;
        execution.payloadSnapshot = payloadSnapshot;
        execution.status = "queued";
        execution.createdAt = now;
        execution.updatedAt = now;
        return execution;
    }

    public UUID messageId() { return messageId; }

    public UUID taskId() { return taskId; }

    public Integer attempt() { return attempt; }

    public String traceId() { return traceId; }

    public JsonNode payloadSnapshot() { return payloadSnapshot; }

    public String status() { return status; }

    public Instant createdAt() { return createdAt; }

    public Instant publishedAt() { return publishedAt; }

    public Instant updatedAt() { return updatedAt; }

    public JsonNode resultJson() { return resultJson; }

    public String errorCode() { return errorCode; }

    public String errorMessage() { return errorMessage; }

    public void markPublished(Instant now) {
        status = "queued";
        publishedAt = now;
        updatedAt = now;
    }

    public void markRunning(Instant now) {
        status = "running";
        if (startedAt == null) {
            startedAt = now;
        }
        updatedAt = now;
    }

    public void markSucceeded(JsonNode result, Instant now) {
        status = "succeeded";
        resultJson = result == null ? null : result.deepCopy();
        finishedAt = now;
        updatedAt = now;
    }

    public void markFailed(String code, String message, Instant now) {
        status = "failed";
        errorCode = code;
        errorMessage = message;
        finishedAt = now;
        updatedAt = now;
    }
}
