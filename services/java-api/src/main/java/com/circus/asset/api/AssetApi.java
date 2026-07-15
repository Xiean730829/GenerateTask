package com.circus.asset.api;

import com.circus.asset.api.dto.*;
import com.circus.common.api.ApiEnvelope;
import com.circus.media.api.dto.MediaFileResponse;
import com.circus.task.api.dto.GenerationTaskResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api")
public interface AssetApi {
    @GetMapping("/projects/{projectId}/assets") ApiEnvelope<List<AssetResponse>> listProjectAssets(@PathVariable UUID projectId);
    @GetMapping("/assets") ApiEnvelope<List<AssetResponse>> listAssets(@RequestParam(required = false) String type);
    @GetMapping("/assets/{assetId}") ApiEnvelope<AssetResponse> getAsset(@PathVariable UUID assetId);
    @PatchMapping("/assets/{assetId}") ApiEnvelope<AssetResponse> updateAsset(@PathVariable UUID assetId, @Valid @RequestBody UpdateAssetRequest request);
    @PostMapping("/assets/{assetId}/revisions") ApiEnvelope<AssetResponse> createRevision(@PathVariable UUID assetId, @RequestBody(required = false) CreateAssetRevisionRequest request);
    @PostMapping("/assets/{assetId}/revisions/{revisionId}/apply") ApiEnvelope<AssetRevisionImpactResponse> applyRevision(@PathVariable UUID assetId, @PathVariable UUID revisionId, @Valid @RequestBody ApplyAssetRevisionRequest request);
    @PostMapping("/projects/{projectId}/asset-extract-tasks") ApiEnvelope<GenerationTaskResponse> createAssetExtractTask(@PathVariable UUID projectId, @Valid @RequestBody AssetExtractTaskRequest request, @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);
    @PostMapping("/assets/{assetId}/reference-image-tasks") ApiEnvelope<GenerationTaskResponse> createReferenceImageTask(@PathVariable UUID assetId, @RequestHeader(value="Idempotency-Key",required=false) String key);
    @GetMapping("/assets/{assetId}/reference-images") ApiEnvelope<List<MediaFileResponse>> listReferenceImages(@PathVariable UUID assetId);
    @PostMapping("/assets/{assetId}/reference-images/{mediaFileId}/confirm") ApiEnvelope<AssetResponse> confirmReferenceImage(@PathVariable UUID assetId, @PathVariable UUID mediaFileId);
}
