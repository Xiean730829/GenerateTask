package com.circus.common.api;

/** Public success envelope. Error responses will use the same shape in a later implementation slice. */
public record ApiEnvelope<T>(boolean success, T data, ApiErrorResponse error) {}
