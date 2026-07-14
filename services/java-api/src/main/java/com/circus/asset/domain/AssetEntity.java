package com.circus.asset.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "asset")
public class AssetEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "owner_user_id", nullable = false) private UUID ownerUserId;
    @Column(name = "type", nullable = false, length = 16) private String type;
    @Column(name = "name", nullable = false, length = 200) private String name;
    @Column(name = "description") private String description;
    @Column(name = "reference_image_media_file_id") private UUID referenceImageMediaFileId;
    @Column(name = "current_revision_id") private UUID currentRevisionId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "attributes", nullable = false, columnDefinition = "jsonb") private JsonNode attributes;
    @Column(name = "locked", nullable = false) private Boolean locked;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AssetEntity() {}
}
