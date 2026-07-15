package com.circus.asset.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Size;
public record UpdateAssetRequest(@Size(min = 1, max = 200) String name, String description,
                                 JsonNode voice, JsonNode attributes) {}
