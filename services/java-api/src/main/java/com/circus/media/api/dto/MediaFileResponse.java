package com.circus.media.api.dto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record MediaFileResponse(UUID id, String fileType, String url, String mimeType, Long sizeBytes,
                                BigDecimal durationSeconds, Integer width, Integer height,
                                String relatedObjectType, UUID relatedObjectId, Instant createdAt) {}
