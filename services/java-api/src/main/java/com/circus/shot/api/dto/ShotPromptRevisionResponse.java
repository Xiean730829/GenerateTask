package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
public record ShotPromptRevisionResponse(UUID id, UUID shotId, Integer revisionNo, String prompt, String source,
                                         JsonNode assetReferenceIds, JsonNode assetOverrides, Instant createdAt) {}
