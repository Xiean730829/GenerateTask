package com.circus.asset.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "asset_reference")
public class AssetReferenceEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "asset_id", nullable = false) private UUID assetId;
    @Column(name = "project_id", nullable = false) private UUID projectId;
    @Column(name = "episode_id") private UUID episodeId;
    @Column(name = "shot_id") private UUID shotId;
    @Column(name = "usage", nullable = false, length = 16) private String usage;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AssetReferenceEntity() {}
}
