package com.circus.project.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank @Size(max = 200) String name,
        String projectType,
        @Min(1) Integer targetDurationSeconds,
        @Size(max = 16) String aspectRatio,
        String style,
        String sourceText) {}
