package com.circus.material.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTextMaterialRequest(@NotBlank String text, @Size(max = 200) String title) {}
