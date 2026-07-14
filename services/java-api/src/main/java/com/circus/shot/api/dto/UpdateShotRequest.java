package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import jakarta.validation.constraints.Positive;
public record UpdateShotRequest(@Positive BigDecimal durationSeconds, Integer sceneIndex, String shotSize,
                                String environmentDescription, JsonNode characterInstances,
                                JsonNode propInstances, String action, String endState, JsonNode dialogues,
                                String cameraMovement, String cameraDescription, String audioDescription,
                                JsonNode continuityLocks, String dialogue) {}
