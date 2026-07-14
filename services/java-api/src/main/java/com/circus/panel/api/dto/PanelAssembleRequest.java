package com.circus.panel.api.dto;
import com.fasterxml.jackson.databind.JsonNode;
public record PanelAssembleRequest(JsonNode timeSpec) {}
