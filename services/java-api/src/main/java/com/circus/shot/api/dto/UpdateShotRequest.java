package com.circus.shot.api.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Positive;
public record UpdateShotRequest(@Positive BigDecimal durationSeconds, String shotSize, String cameraMovement,
                                String action, String dialogue) {}
