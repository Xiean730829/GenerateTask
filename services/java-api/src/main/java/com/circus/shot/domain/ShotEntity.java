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

    @Column(name = "scene_index")
    private Integer sceneIndex;

    @Column(name = "duration_seconds", precision = 8, scale = 2)
    private BigDecimal durationSeconds;

    @Column(name = "shot_size", length = 64)
    private String shotSize;

    @Column(name = "environment_description")
    private String environmentDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "characters", columnDefinition = "jsonb")
    private JsonNode characters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "character_instances", columnDefinition = "jsonb")
    private JsonNode characterInstances;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "prop_instances", columnDefinition = "jsonb")
    private JsonNode propInstances;

    @Column(name = "action")
    private String action;

    @Column(name = "end_state")
    private String endState;

    @Column(name = "dialogue")
    private String dialogue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dialogues", columnDefinition = "jsonb")
    private JsonNode dialogues;

    @Column(name = "camera_movement", length = 64)
    private String cameraMovement;

    @Column(name = "camera_description")
    private String cameraDescription;

    @Column(name = "audio_description")
    private String audioDescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "continuity_locks", columnDefinition = "jsonb")
    private JsonNode continuityLocks;

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
