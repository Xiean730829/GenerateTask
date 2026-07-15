package com.circus.panel.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "panel_video")
public class PanelVideoEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "panel_id", nullable = false) private UUID panelId;
    @Column(name = "panel_revision_id", nullable = false) private UUID panelRevisionId;
    @Column(name = "task_id") private UUID taskId;
    @Column(name = "media_file_id") private UUID mediaFileId;
    @Column(name = "status", nullable = false, length = 16) private String status;
    @Column(name = "confirmed", nullable = false) private Boolean confirmed;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected PanelVideoEntity() {}
}
