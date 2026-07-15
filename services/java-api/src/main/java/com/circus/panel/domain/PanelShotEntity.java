package com.circus.panel.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "panel_shot")
public class PanelShotEntity {
    @EmbeddedId private PanelShotId id;
    @Column(name = "episode_id", nullable = false) private UUID episodeId;
    @Column(name = "order_index", nullable = false) private Integer orderIndex;
    protected PanelShotEntity() {}
}
