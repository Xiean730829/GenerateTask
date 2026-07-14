package com.circus.script.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
public record ShotTaskRequest(@Min(3) @Max(5) Integer targetShotCount) {}
