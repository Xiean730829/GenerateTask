package com.circus.panel.api.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/** Optional explicit panel selection; omitted means all eligible panels in the episode. */
public record PanelVideoBatchRequest(@Size(min = 1) List<UUID> panelIds) {}
