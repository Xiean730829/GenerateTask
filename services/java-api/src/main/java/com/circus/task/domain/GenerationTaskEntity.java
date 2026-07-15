package com.circus.task.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;

import java.sql.Types;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "generation_task")
public class GenerationTaskEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(name = "episode_id", nullable = false) private UUID episodeId;
    @Column(name = "shot_id") private UUID shotId;
    @Column(name = "panel_id") private UUID panelId;
    @Column(name = "owner_user_id", nullable = false) private UUID ownerUserId;
    @Column(name = "task_type", nullable = false, length = 64) private String taskType;
    @Column(name = "status", nullable = false, length = 16) private String status;
    @Column(name = "attempt", nullable = false) private Integer attempt;
    @Column(name = "progress", nullable = false) private Integer progress;
    @Column(name = "retry_count", nullable = false) private Integer retryCount;
    @Column(name = "max_retries", nullable = false) private Integer maxRetries;
    @Column(name = "retryable") private Boolean retryable;
    @Column(name = "idempotency_key", length = 200) private String idempotencyKey;
    @Column(name = "idempotency_operation", length = 160) private String idempotencyOperation;
    @JdbcTypeCode(Types.CHAR)
    @Column(name = "request_fingerprint", length = 64)
    private String requestFingerprint;
    @Column(name = "trace_id", length = 128) private String traceId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "result_ref", columnDefinition = "jsonb") private JsonNode resultRef;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "result_json", columnDefinition = "jsonb") private JsonNode resultJson;
    @Column(name = "error_code", length = 128) private String errorCode;
    @Column(name = "error_message") private String errorMessage;
    @Column(name = "cost_points") private Integer costPoints;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "queued_at") private Instant queuedAt;
    @Column(name = "started_at") private Instant startedAt;
    @Column(name = "finished_at") private Instant finishedAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected GenerationTaskEntity() {}

    public static GenerationTaskEntity pending(
            UUID id,
            UUID projectId,
            UUID episodeId,
            UUID shotId,
            UUID panelId,
            UUID ownerUserId,
            String taskType,
            String idempotencyKey,
            String idempotencyOperation,
            String requestFingerprint,
            String traceId,
            Instant now,
            int maxRetries) {
        GenerationTaskEntity task = new GenerationTaskEntity();
        task.id = id;
        task.projectId = projectId;
        task.episodeId = episodeId;
        task.shotId = shotId;
        task.panelId = panelId;
        task.ownerUserId = ownerUserId;
        task.taskType = taskType;
        task.status = "pending";
        task.attempt = 0;
        task.progress = 0;
        task.retryCount = 0;
        task.maxRetries = maxRetries;
        task.retryable = null;
        task.idempotencyKey = idempotencyKey;
        task.idempotencyOperation = idempotencyOperation;
        task.requestFingerprint = requestFingerprint;
        task.traceId = traceId;
        task.createdAt = now;
        task.updatedAt = now;
        return task;
    }

    public UUID id() { return id; }

    public UUID projectId() { return projectId; }

    public UUID episodeId() { return episodeId; }

    public UUID shotId() { return shotId; }

    public UUID panelId() { return panelId; }

    public UUID ownerUserId() { return ownerUserId; }

    public String taskType() { return taskType; }

    public String status() { return status; }

    public Integer attempt() { return attempt; }

    public Integer progress() { return progress; }

    public Integer retryCount() { return retryCount; }

    public Integer maxRetries() { return maxRetries; }

    public Boolean retryable() { return retryable; }

    public String idempotencyKey() { return idempotencyKey; }

    public String idempotencyOperation() { return idempotencyOperation; }

    public String requestFingerprint() { return requestFingerprint; }

    public String traceId() { return traceId; }

    public Instant createdAt() { return createdAt; }

    public Instant updatedAt() { return updatedAt; }

    public JsonNode resultRef() { return resultRef; }

    public JsonNode resultJson() { return resultJson; }

    public String errorCode() { return errorCode; }

    public String errorMessage() { return errorMessage; }

    public Integer costPoints() { return costPoints; }

    public void markQueued(Instant now) {
        status = "queued";
        queuedAt = now;
        retryable = null;
        errorCode = null;
        errorMessage = null;
        updatedAt = now;
    }

    public void markRunning(int nextProgress, Instant now) {
        status = "running";
        progress = nextProgress;
        if (startedAt == null) {
            startedAt = now;
        }
        updatedAt = now;
    }

    public void markFailed(boolean canRetry, String code, String message, Instant now) {
        status = "failed";
        progress = 100;
        retryable = canRetry;
        resultJson = null;
        errorCode = code;
        errorMessage = message;
        finishedAt = now;
        updatedAt = now;
    }

    public void markSucceeded(JsonNode result, Instant now) {
        status = "succeeded";
        progress = 100;
        retryable = null;
        resultJson = result == null ? null : result.deepCopy();
        errorCode = null;
        errorMessage = null;
        finishedAt = now;
        updatedAt = now;
    }

    public void markPublishFailed(String code, String message, Instant now) {
        if ("retrying".equals(status)) {
            markFailed(true, code, message, now);
            return;
        }
        retryable = true;
        errorCode = code;
        errorMessage = message;
        updatedAt = now;
    }

    public void beginRetry(String nextTraceId, Instant now) {
        status = "retrying";
        retryCount = retryCount + 1;
        attempt = attempt + 1;
        progress = 0;
        retryable = null;
        errorCode = null;
        errorMessage = null;
        resultRef = null;
        resultJson = null;
        queuedAt = null;
        startedAt = null;
        finishedAt = null;
        traceId = nextTraceId;
        updatedAt = now;
    }

    /**
     * Advances the dispatch identity after an initial broker failure without
     * making the task look queued before Rabbit confirms the new publication.
     */
    public void beginPendingRepublish(String nextTraceId, Instant now) {
        status = "pending";
        retryCount = retryCount + 1;
        attempt = attempt + 1;
        progress = 0;
        retryable = null;
        errorCode = null;
        errorMessage = null;
        resultRef = null;
        resultJson = null;
        queuedAt = null;
        startedAt = null;
        finishedAt = null;
        traceId = nextTraceId;
        updatedAt = now;
    }

    public void cancel(Instant now) {
        status = "canceled";
        finishedAt = now;
        updatedAt = now;
    }
}
