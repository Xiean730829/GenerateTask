package com.circus.shot.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateShotAssetOverrideRequest(@NotNull UUID assetId, JsonNode attributes) {}
