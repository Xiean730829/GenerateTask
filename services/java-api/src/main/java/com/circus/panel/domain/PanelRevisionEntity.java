package com.circus.panel.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "panel_revision")
public class PanelRevisionEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "panel_id", nullable = false) private UUID panelId;
    @Column(name = "revision_no", nullable = false) private Integer revisionNo;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "shot_prompt_revision_ids", nullable = false, columnDefinition = "jsonb") private JsonNode shotPromptRevisionIds;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "asset_revision_ids", nullable = false, columnDefinition = "jsonb") private JsonNode assetRevisionIds;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "keyframe_media_ids", nullable = false, columnDefinition = "jsonb") private JsonNode keyframeMediaIds;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected PanelRevisionEntity() {}
}
