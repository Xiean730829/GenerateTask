package com.circus.episode.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.episode.api.dto.EpisodeResponse;
import com.circus.episode.api.dto.VideoCapabilityResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api")
public interface EpisodeApi {
    @GetMapping("/projects/{projectId}/episodes")
    ApiEnvelope<List<EpisodeResponse>> listEpisodes(@PathVariable UUID projectId);
    @GetMapping("/episodes/{episodeId}")
    ApiEnvelope<EpisodeResponse> getEpisode(@PathVariable UUID episodeId);
    @GetMapping("/episodes/{episodeId}/video-capability")
    ApiEnvelope<VideoCapabilityResponse> getVideoCapability(@PathVariable UUID episodeId);
}
