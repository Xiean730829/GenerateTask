package com.circus.shot.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.shot.api.dto.ShotResponse;
import com.circus.shot.api.dto.UpdateShotRequest;
import com.circus.shot.api.dto.ShotPromptRevisionResponse;
import com.circus.shot.api.dto.ShotAssetOverrideResponse;
import com.circus.shot.api.dto.KeyframeResponse;
import com.circus.shot.api.dto.KeyframeBatchRequest;
import com.circus.shot.api.dto.KeyframeBatchResult;
import com.circus.shot.api.dto.CreateAssetForShotRequest;
import com.circus.shot.api.dto.CreateShotAssetOverrideRequest;
import com.circus.shot.api.dto.CreateShotPromptRevisionRequest;
import com.circus.shot.api.dto.DeleteShotAssetOverrideResponse;
import com.circus.asset.api.dto.AssetResponse;
import com.circus.task.api.dto.GenerationTaskResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

/** Endpoint declarations only; request DTO expansion follows the frozen OpenAPI contract. */
@RequestMapping("/api")
public interface ShotApi {
    @GetMapping("/episodes/{episodeId}/shots") ApiEnvelope<List<ShotResponse>> listEpisodeShots(@PathVariable UUID episodeId);
    @GetMapping("/shots/{shotId}") ApiEnvelope<ShotResponse> getShot(@PathVariable UUID shotId);
    @PatchMapping("/shots/{shotId}") ApiEnvelope<ShotResponse> updateShot(@PathVariable UUID shotId, @Valid @RequestBody UpdateShotRequest request);
    @GetMapping("/shots/{shotId}/prompt-revisions") ApiEnvelope<List<ShotPromptRevisionResponse>> listPromptRevisions(@PathVariable UUID shotId);
    @PostMapping("/shots/{shotId}/prompt-revisions") ApiEnvelope<ShotPromptRevisionResponse> createPromptRevision(@PathVariable UUID shotId, @Valid @RequestBody CreateShotPromptRevisionRequest request);
    @GetMapping("/shots/{shotId}/asset-overrides") ApiEnvelope<List<ShotAssetOverrideResponse>> listAssetOverrides(@PathVariable UUID shotId);
    @PostMapping("/shots/{shotId}/asset-overrides") ApiEnvelope<ShotAssetOverrideResponse> createAssetOverride(@PathVariable UUID shotId, @Valid @RequestBody CreateShotAssetOverrideRequest request);
    @DeleteMapping("/shots/{shotId}/asset-overrides/{assetId}") ApiEnvelope<DeleteShotAssetOverrideResponse> deleteAssetOverride(@PathVariable UUID shotId, @PathVariable UUID assetId);
    @PostMapping("/shots/{shotId}/assets") ApiEnvelope<AssetResponse> createAssetForShot(@PathVariable UUID shotId, @Valid @RequestBody CreateAssetForShotRequest request);
    @GetMapping("/episodes/{episodeId}/keyframes") ApiEnvelope<List<KeyframeResponse>> listKeyframes(@PathVariable UUID episodeId);
    @PostMapping("/keyframes/{keyframeId}/select") ApiEnvelope<KeyframeResponse> selectKeyframe(@PathVariable UUID keyframeId);
    @PostMapping("/shots/{shotId}/keyframe-tasks") ApiEnvelope<GenerationTaskResponse> createKeyframeTask(@PathVariable UUID shotId, @RequestHeader(value="Idempotency-Key",required=false) String key);
    @PostMapping("/episodes/{episodeId}/keyframe-tasks/batch") ApiEnvelope<KeyframeBatchResult> createKeyframeBatch(@PathVariable UUID episodeId, @Valid @RequestBody(required = false) KeyframeBatchRequest request, @RequestHeader(value="Idempotency-Key",required=false) String key);
}
