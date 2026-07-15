package com.circus.asset.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
public record CreateAssetRevisionRequest(JsonNode attributes) {}
