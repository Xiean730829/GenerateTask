package com.circus.common.api;

import com.fasterxml.jackson.databind.JsonNode;

/** Stable public error shape defined by the frozen OpenAPI contract. */
public record ApiErrorResponse(String code, String message, JsonNode details) {}
