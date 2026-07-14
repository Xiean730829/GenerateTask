package com.circus.asset.api.dto;
import java.time.Instant; import java.util.UUID;
public record ReferenceImageResponse(UUID mediaFileId, String status, Instant createdAt) {}
