package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
public record ShotAssetOverrideResponse(UUID id, UUID shotId, UUID assetId, JsonNode attributes, Instant createdAt) {}
