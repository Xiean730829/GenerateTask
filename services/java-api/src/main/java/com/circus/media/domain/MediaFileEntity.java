package com.circus.media.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media_file")
public class MediaFileEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "owner_user_id") private UUID ownerUserId;
    @Column(name = "project_id") private UUID projectId;
    @Column(name = "episode_id") private UUID episodeId;
    @Column(name = "file_type", nullable = false, length = 32) private String fileType;
    @Column(name = "bucket", length = 128) private String bucket;
    @Column(name = "object_key", nullable = false) private String objectKey;
    @Column(name = "mime_type", length = 128) private String mimeType;
    @Column(name = "size_bytes") private Long sizeBytes;
    @Column(name = "duration_seconds", precision = 10, scale = 2) private BigDecimal durationSeconds;
    @Column(name = "width") private Integer width;
    @Column(name = "height") private Integer height;
    @Column(name = "related_object_type", length = 32) private String relatedObjectType;
    @Column(name = "related_object_id") private UUID relatedObjectId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected MediaFileEntity() {}
}
