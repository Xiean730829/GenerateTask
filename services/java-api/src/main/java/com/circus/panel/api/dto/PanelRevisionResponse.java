package com.circus.panel.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record PanelRevisionResponse(UUID id, UUID panelId, Integer revisionNo,
                                    JsonNode shotPromptRevisionIds, JsonNode assetRevisionIds,
                                    JsonNode keyframeMediaIds, Instant createdAt) {}
