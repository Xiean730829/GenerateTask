package com.circus.shot.api.dto;
import com.circus.media.api.dto.MediaFileResponse;
import java.time.Instant;
import java.util.UUID;
public record KeyframeResponse(UUID id, UUID shotId, UUID mediaFileId, MediaFileResponse mediaFile,
                               String status, UUID promptRevisionId, Instant createdAt) {}
