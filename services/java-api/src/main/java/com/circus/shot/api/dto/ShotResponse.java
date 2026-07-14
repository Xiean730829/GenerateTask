package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShotResponse(UUID id, UUID episodeId, UUID scriptId, Integer orderIndex, Integer sceneIndex,
                           BigDecimal durationSeconds, String shotSize, String environmentDescription,
                           JsonNode characters, JsonNode characterInstances, JsonNode propInstances,
                           String action, String endState, String dialogue, JsonNode dialogues,
                           String cameraMovement, String cameraDescription, String audioDescription,
                           JsonNode continuityLocks, String generationPrompt, UUID currentPromptRevisionId,
                           String status, Instant createdAt) {}
