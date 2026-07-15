package com.circus.script.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record ScriptResponse(UUID id, UUID episodeId, String title, String logline, String storyPromise,
                             String storySummary, String finalOutcome, String content, Integer targetDurationSeconds,
                             String language, String genre, String style, JsonNode characters, JsonNode scenes,
                             Integer version, String status, Instant confirmedAt, Instant createdAt, Instant updatedAt) {}
