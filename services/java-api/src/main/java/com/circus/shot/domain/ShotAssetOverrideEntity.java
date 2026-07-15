package com.circus.shot.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "shot_asset_override")
public class ShotAssetOverrideEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "shot_id", nullable = false) private UUID shotId;
    @Column(name = "asset_id", nullable = false) private UUID assetId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "attributes", nullable = false, columnDefinition = "jsonb") private JsonNode attributes;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected ShotAssetOverrideEntity() {}
}
