package com.circus.panel.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "panel")
public class PanelEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "episode_id", nullable = false) private UUID episodeId;
    @Column(name = "name", length = 200) private String name;
    @Column(name = "order_index", nullable = false) private Integer orderIndex;
    @Column(name = "duration_seconds", precision = 8, scale = 2) private BigDecimal durationSeconds;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "time_spec", columnDefinition = "jsonb") private JsonNode timeSpec;
    @Column(name = "current_revision_id") private UUID currentRevisionId;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected PanelEntity() {}
}
