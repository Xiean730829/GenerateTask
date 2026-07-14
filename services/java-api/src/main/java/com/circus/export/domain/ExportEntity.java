package com.circus.export.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "export")
public class ExportEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "timeline_id", nullable = false) private UUID timelineId;
    @Column(name = "task_id") private UUID taskId;
    @Column(name = "media_file_id") private UUID mediaFileId;
    @Column(name = "status", nullable = false, length = 16) private String status;
    @Column(name = "object_key") private String objectKey;
    @Column(name = "format", length = 16) private String format;
    @Column(name = "resolution", length = 32) private String resolution;
    @Column(name = "duration_seconds", precision = 10, scale = 2) private BigDecimal durationSeconds;
    @Column(name = "size_bytes") private Long sizeBytes;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "finished_at") private Instant finishedAt;
    protected ExportEntity() {}
}
