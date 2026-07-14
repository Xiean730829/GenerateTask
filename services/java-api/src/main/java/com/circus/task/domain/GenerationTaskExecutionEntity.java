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

/** Immutable dispatch identity and callback outcome for one GenerationTask attempt. */
@Entity
@Table(name = "generation_task_execution")
public class GenerationTaskExecutionEntity {

    @Id
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "task_id", nullable = false)
    private UUID taskId;

    @Column(name = "attempt", nullable = false)
    private Integer attempt;

    @Column(name = "trace_id", length = 128)
    private String traceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_snapshot", nullable = false, columnDefinition = "jsonb")
    private JsonNode payloadSnapshot;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

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
}
