package com.circus.panel.api;
import com.circus.common.api.ApiEnvelope;
import com.circus.panel.api.dto.*;
import com.circus.task.api.dto.GenerationTaskResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
@RequestMapping("/api")
public interface PanelApi {
    @GetMapping("/episodes/{episodeId}/panels") ApiEnvelope<List<PanelResponse>> listPanels(@PathVariable UUID episodeId);
    @PostMapping("/episodes/{episodeId}/panels/assemble") ApiEnvelope<List<PanelResponse>> assemblePanels(@PathVariable UUID episodeId, @RequestBody(required = false) PanelAssembleRequest request);
    @PostMapping("/panels/{panelId}/video-tasks") ApiEnvelope<GenerationTaskResponse> createVideoTask(@PathVariable UUID panelId, @Valid @RequestBody(required = false) PanelVideoTaskRequest request, @RequestHeader(value = "Idempotency-Key", required = false) String key);
    @PostMapping("/episodes/{episodeId}/panel-video-tasks/batch") ApiEnvelope<PanelVideoBatchResult> createBatchVideoTasks(@PathVariable UUID episodeId, @Valid @RequestBody(required = false) PanelVideoBatchRequest request, @RequestHeader(value = "Idempotency-Key", required = false) String key);
    @GetMapping("/panels/{panelId}/videos") ApiEnvelope<List<PanelVideoResponse>> listPanelVideos(@PathVariable UUID panelId);
    @GetMapping("/episodes/{episodeId}/panel-videos") ApiEnvelope<List<PanelVideoResponse>> listEpisodePanelVideos(@PathVariable UUID episodeId);
    @PostMapping("/panels/{panelId}/videos/regenerate") ApiEnvelope<GenerationTaskResponse> regenerateVideo(@PathVariable UUID panelId, @RequestHeader(value = "Idempotency-Key", required = false) String key);
    @PostMapping("/panels/{panelId}/videos/confirm") ApiEnvelope<PanelVideoResponse> confirmVideo(@PathVariable UUID panelId, @Valid @RequestBody ConfirmPanelVideoRequest request);
}
