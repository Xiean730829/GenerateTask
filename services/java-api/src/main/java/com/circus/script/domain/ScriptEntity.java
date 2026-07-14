package com.circus.script.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Persistence model for the one editable script of an episode. */
@Entity
@Table(name = "script")
public class ScriptEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "episode_id", nullable = false)
    private UUID episodeId;

    @Column(name = "title", length = 300)
    private String title;

    @Column(name = "logline")
    private String logline;

    @Column(name = "story_promise")
    private String storyPromise;

    @Column(name = "story_summary")
    private String storySummary;

    @Column(name = "final_outcome")
    private String finalOutcome;

    @Column(name = "content")
    private String content;

    @Column(name = "target_duration_seconds")
    private Integer targetDurationSeconds;

    @Column(name = "language", length = 32)
    private String language;

    @Column(name = "genre", length = 128)
    private String genre;

    @Column(name = "style")
    private String style;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "characters", nullable = false, columnDefinition = "jsonb")
    private JsonNode characters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scenes", nullable = false, columnDefinition = "jsonb")
    private JsonNode scenes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generation_meta", columnDefinition = "jsonb")
    private JsonNode generationMeta;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ScriptEntity() {}
}
