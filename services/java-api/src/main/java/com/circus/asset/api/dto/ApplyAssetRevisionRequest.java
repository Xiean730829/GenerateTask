package com.circus.asset.api.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
public record ApplyAssetRevisionRequest(@NotEmpty List<UUID> shotIds) {}
