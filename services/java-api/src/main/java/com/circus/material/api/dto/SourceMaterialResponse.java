package com.circus.material.api.dto;

import java.time.Instant;
import java.util.UUID;

public record SourceMaterialResponse(UUID id, UUID projectId, String type, String text, String title,
                                     String status, Instant createdAt) {}
