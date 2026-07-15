package com.circus.asset.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_reference_image")
public class AssetReferenceImageEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "asset_id", nullable = false) private UUID assetId;
    @Column(name = "media_file_id", nullable = false) private UUID mediaFileId;
    @Column(name = "status", nullable = false, length = 16) private String status;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AssetReferenceImageEntity() {}
}
