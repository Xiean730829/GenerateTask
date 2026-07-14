package com.circus.shot.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Persistence model for the editable shot production unit. */
@Entity
@Table(name = "shot")
public class ShotEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "episode_id", nullable = false)
    private UUID episodeId;

    @Column(name = "script_id", nullable = false)
    private UUID scriptId;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "duration_seconds", precision = 8, scale = 2)
    private BigDecimal durationSeconds;

    @Column(name = "shot_size", length = 64)
    private String shotSize;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "characters", columnDefinition = "jsonb")
    private JsonNode characters;

    @Column(name = "action")
    private String action;

    @Column(name = "dialogue")
    private String dialogue;

    @Column(name = "camera_movement", length = 64)
    private String cameraMovement;

    @Column(name = "generation_prompt")
    private String generationPrompt;

    @Column(name = "current_prompt_revision_id")
    private UUID currentPromptRevisionId;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ShotEntity() {}
}
