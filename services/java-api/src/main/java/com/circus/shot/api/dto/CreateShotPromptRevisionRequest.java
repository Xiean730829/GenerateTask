package com.circus.shot.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateShotPromptRevisionRequest(
        @NotBlank String prompt,
        List<@Valid ShotAssetOverrideInput> assetOverrides) {}
