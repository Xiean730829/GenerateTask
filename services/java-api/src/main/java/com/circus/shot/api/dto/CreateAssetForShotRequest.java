package com.circus.shot.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAssetForShotRequest(
        @NotBlank String type,
        @NotBlank @Size(max = 200) String name,
        @NotBlank String description) {}
