package com.circus.export.api.dto;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
public record ExportResponse(UUID id, UUID timelineId, UUID taskId, String status, String fileUrl, String objectKey, String format, String resolution, BigDecimal durationSeconds, Long sizeBytes, Instant createdAt, Instant finishedAt) {}
