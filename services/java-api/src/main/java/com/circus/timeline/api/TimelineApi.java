package com.circus.timeline.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.task.api.dto.GenerationTaskResponse;
import com.circus.timeline.api.dto.AudioSubtitleTaskRequest;
import com.circus.timeline.api.dto.TimelineComposeRequest;
import com.circus.timeline.api.dto.TimelineResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api")
public interface TimelineApi {
    @GetMapping("/episodes/{episodeId}/timeline")
    ApiEnvelope<TimelineResponse> getTimeline(@PathVariable UUID episodeId);

    @PostMapping("/episodes/{episodeId}/audio-subtitle-tasks")
    ApiEnvelope<GenerationTaskResponse> createAudioSubtitleTask(
            @PathVariable UUID episodeId,
            @Valid @RequestBody(required = false) AudioSubtitleTaskRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);

    @PostMapping("/episodes/{episodeId}/timeline/compose")
    ApiEnvelope<TimelineResponse> composeTimeline(
            @PathVariable UUID episodeId,
            @Valid @RequestBody(required = false) TimelineComposeRequest request);
}
