package com.circus.script.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.script.api.dto.ScriptResponse;
import com.circus.script.api.dto.ScriptTaskRequest;
import com.circus.script.api.dto.ShotTaskRequest;
import com.circus.script.api.dto.UpdateScriptRequest;
import com.circus.task.api.dto.GenerationTaskResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

/** Endpoint declarations only; controllers are intentionally deferred. */
@RequestMapping("/api")
public interface ScriptApi {
    @PostMapping("/episodes/{episodeId}/script-tasks") ApiEnvelope<GenerationTaskResponse> createScriptTask(@PathVariable UUID episodeId, @Valid @RequestBody(required = false) ScriptTaskRequest request, @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);
    @GetMapping("/episodes/{episodeId}/script") ApiEnvelope<ScriptResponse> getEpisodeScript(@PathVariable UUID episodeId);
    @GetMapping("/scripts/{scriptId}") ApiEnvelope<ScriptResponse> getScript(@PathVariable UUID scriptId);
    @PatchMapping("/scripts/{scriptId}") ApiEnvelope<ScriptResponse> updateScript(@PathVariable UUID scriptId, @Valid @RequestBody UpdateScriptRequest request);
    @PostMapping("/scripts/{scriptId}/confirm") ApiEnvelope<GenerationTaskResponse> confirmScriptAndGenerateShots(@PathVariable UUID scriptId, @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);
    @PostMapping("/scripts/{scriptId}/shot-tasks") ApiEnvelope<GenerationTaskResponse> createShotTask(@PathVariable UUID scriptId, @Valid @RequestBody(required = false) ShotTaskRequest request, @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);
}
