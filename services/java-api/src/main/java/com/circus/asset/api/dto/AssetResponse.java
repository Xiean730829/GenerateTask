package com.circus.asset.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record AssetResponse(UUID id, UUID ownerUserId, String type, String name, String description,
                            String referenceImageUrl, UUID currentRevisionId, JsonNode attributes,
                            boolean locked, Instant createdAt) {}
