package com.circus.panel.api.dto;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
public record ConfirmPanelVideoRequest(@NotNull UUID panelVideoId) {}
