package com.circus.script.api.dto;

import jakarta.validation.constraints.NotBlank;
public record UpdateScriptRequest(@NotBlank String content) {}
