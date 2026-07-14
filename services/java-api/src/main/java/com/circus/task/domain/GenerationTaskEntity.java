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
}
