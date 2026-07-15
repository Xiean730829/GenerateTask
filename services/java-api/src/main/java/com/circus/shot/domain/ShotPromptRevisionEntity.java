package com.circus.shot.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Immutable persisted snapshot of one shot prompt revision. */
@Entity
@Table(name = "shot_prompt_revision")
public class ShotPromptRevisionEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "shot_id", nullable = false)
    private UUID shotId;

    @Column(name = "revision_no", nullable = false)
    private Integer revisionNo;

    @Column(name = "prompt", nullable = false)
    private String prompt;

    @Column(name = "source", nullable = false, length = 16)
    private String source;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "asset_reference_ids", columnDefinition = "jsonb")
    private JsonNode assetReferenceIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "asset_overrides_snapshot", nullable = false, columnDefinition = "jsonb")
    private JsonNode assetOverridesSnapshot;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ShotPromptRevisionEntity() {}
}
