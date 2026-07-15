package com.circus.shot.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "keyframe")
public class KeyframeEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "shot_id", nullable = false) private UUID shotId;
    @Column(name = "media_file_id", nullable = false) private UUID mediaFileId;
    @Column(name = "prompt_revision_id") private UUID promptRevisionId;
    @Column(name = "status", nullable = false, length = 16) private String status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected KeyframeEntity() {}
}
