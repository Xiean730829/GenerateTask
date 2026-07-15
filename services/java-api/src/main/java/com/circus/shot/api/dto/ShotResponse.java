package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShotResponse(UUID id, UUID episodeId, UUID scriptId, Integer orderIndex, BigDecimal durationSeconds,
                           String shotSize, JsonNode characters, String action, String dialogue,
                           String cameraMovement, String generationPrompt, UUID currentPromptRevisionId,
                           String status, Instant createdAt) {}
