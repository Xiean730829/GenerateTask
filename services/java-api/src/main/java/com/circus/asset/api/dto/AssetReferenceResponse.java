package com.circus.asset.api.dto;

import java.time.Instant;
import java.util.UUID;

public record AssetReferenceResponse(UUID id, UUID assetId, UUID projectId, UUID episodeId,
                                     UUID shotId, String usage, Instant createdAt) {}
