package com.circus.material.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.material.api.dto.CreateTextMaterialRequest;
import com.circus.material.api.dto.SourceMaterialResponse;
import com.circus.material.api.dto.UpdateSourceMaterialRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api")
public interface MaterialApi {
    @PostMapping("/projects/{projectId}/materials/text")
    ApiEnvelope<SourceMaterialResponse> createTextMaterial(@PathVariable UUID projectId,
                                                            @Valid @RequestBody CreateTextMaterialRequest request);
    @GetMapping("/projects/{projectId}/materials")
    ApiEnvelope<List<SourceMaterialResponse>> listProjectMaterials(@PathVariable UUID projectId);
    @GetMapping("/materials/{materialId}")
    ApiEnvelope<SourceMaterialResponse> getMaterial(@PathVariable UUID materialId);
    @PatchMapping("/materials/{materialId}")
    ApiEnvelope<SourceMaterialResponse> updateMaterial(@PathVariable UUID materialId,
                                                        @Valid @RequestBody UpdateSourceMaterialRequest request);
}
