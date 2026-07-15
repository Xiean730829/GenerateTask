package com.circus.episode.api.dto;

import java.time.Instant;
import java.util.UUID;

public record EpisodeResponse(UUID id, UUID projectId, String title, String synopsis, Integer orderIndex,
                              Integer targetDurationSeconds, String status, Instant createdAt, Instant updatedAt) {}
