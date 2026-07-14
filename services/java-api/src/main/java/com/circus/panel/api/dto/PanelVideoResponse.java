package com.circus.panel.api.dto;
import com.circus.media.api.dto.MediaFileResponse;
import java.time.Instant;
import java.util.UUID;
public record PanelVideoResponse(UUID id, UUID panelId, UUID panelRevisionId, UUID taskId, UUID mediaFileId,
                                 MediaFileResponse mediaFile,
                                 String status, Instant createdAt) {}
