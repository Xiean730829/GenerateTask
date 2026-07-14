package com.circus.panel.api.dto;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record PanelResponse(UUID id, UUID episodeId, String name, Integer orderIndex, List<UUID> shotIds,
                            BigDecimal durationSeconds, JsonNode timeSpec, UUID currentRevisionId, Instant createdAt) {}
