package com.circus.asset.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "asset_revision")
public class AssetRevisionEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "asset_id", nullable = false) private UUID assetId;
    @Column(name = "revision_no", nullable = false) private Integer revisionNo;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "attributes", nullable = false, columnDefinition = "jsonb") private JsonNode attributes;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AssetRevisionEntity() {}
}
