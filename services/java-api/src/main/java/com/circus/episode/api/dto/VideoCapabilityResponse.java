package com.circus.episode.api.dto;

import java.util.List;

public record VideoCapabilityResponse(Integer minPanelDurationSeconds, Integer maxPanelDurationSeconds,
                                      List<Integer> supportedDurationsSeconds) {}
