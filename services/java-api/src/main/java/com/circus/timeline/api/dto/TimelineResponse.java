package com.circus.timeline.api.dto;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant; import java.util.UUID;
public record TimelineResponse(UUID id, UUID episodeId, String status, JsonNode videoTrack, JsonNode audioTrack, JsonNode subtitleTrack, Instant createdAt, Instant updatedAt) {}
