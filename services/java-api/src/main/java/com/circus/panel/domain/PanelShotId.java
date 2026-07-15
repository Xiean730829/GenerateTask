package com.circus.panel.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;
import java.util.Objects;

@Embeddable
public class PanelShotId implements Serializable {
    @Column(name = "panel_id", nullable = false) private UUID panelId;
    @Column(name = "shot_id", nullable = false) private UUID shotId;
    protected PanelShotId() {}

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof PanelShotId that)) return false;
        return Objects.equals(panelId, that.panelId) && Objects.equals(shotId, that.shotId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(panelId, shotId);
    }
}
