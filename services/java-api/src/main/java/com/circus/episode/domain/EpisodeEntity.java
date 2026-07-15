package com.circus.episode.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Persistence model for one project episode. */
@Entity
@Table(name = "episode")
public class EpisodeEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "synopsis")
    private String synopsis;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "target_duration_seconds")
    private Integer targetDurationSeconds;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected EpisodeEntity() {}
}
