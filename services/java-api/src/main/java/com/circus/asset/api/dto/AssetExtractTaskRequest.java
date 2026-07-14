package com.circus.asset.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** Scope for an asset extraction task; every task belongs to one production episode. */
public record AssetExtractTaskRequest(@NotNull UUID episodeId, UUID shotId) {}
