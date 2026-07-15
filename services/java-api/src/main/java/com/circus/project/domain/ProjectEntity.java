package com.circus.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Persistence model for the {@code project} table. */
@Entity
@Table(name = "project")
public class ProjectEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "project_type", nullable = false, length = 32)
    private String projectType;

    @Column(name = "stage", nullable = false, length = 32)
    private String stage;

    @Column(name = "target_duration_seconds")
    private Integer targetDurationSeconds;

    @Column(name = "aspect_ratio", length = 16)
    private String aspectRatio;

    @Column(name = "style")
    private String style;

    @Column(name = "default_episode_id", nullable = false)
    private UUID defaultEpisodeId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProjectEntity() {}
}
