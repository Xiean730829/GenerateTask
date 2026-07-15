package com.circus.asset.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record AssetRevisionResponse(UUID id, UUID assetId, Integer revisionNo, JsonNode attributes, Instant createdAt) {}
