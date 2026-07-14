package com.circus.task.api.dto;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
public record GenerationTaskResponse(UUID id, UUID projectId, UUID episodeId, UUID shotId, UUID panelId,
                                     String taskType, String status, Integer attempt, Integer progress,
                                     String errorCode, String errorMessage, Boolean retryable, JsonNode resultRef,
                                     Integer costPoints, Instant createdAt, Instant updatedAt) {}
