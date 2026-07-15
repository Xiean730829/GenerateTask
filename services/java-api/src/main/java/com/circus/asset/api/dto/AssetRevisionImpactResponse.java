package com.circus.asset.api.dto;

import java.util.List;
import java.util.UUID;

public record AssetRevisionImpactResponse(AssetRevisionResponse revision, List<UUID> affectedShotIds,
                                          List<UUID> stalePanelRevisionIds, List<UUID> stalePanelVideoIds) {}
