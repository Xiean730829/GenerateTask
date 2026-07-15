package com.circus.project.api.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(UUID id, UUID ownerUserId, String name, String projectType, String stage,
                              Integer targetDurationSeconds, String aspectRatio, String style,
                              UUID defaultEpisodeId, Instant createdAt, Instant updatedAt) {}
