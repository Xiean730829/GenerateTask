package com.circus.task.api;
import com.circus.common.api.ApiEnvelope;
import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
@RequestMapping("/api")
public interface TaskApi {
 @GetMapping("/tasks/{taskId}") ApiEnvelope<GenerationTaskResponse> getTask(@PathVariable UUID taskId);
 @GetMapping("/projects/{projectId}/tasks") ApiEnvelope<List<GenerationTaskResponse>> listProjectTasks(@PathVariable UUID projectId);
 @GetMapping("/episodes/{episodeId}/tasks") ApiEnvelope<List<GenerationTaskResponse>> listEpisodeTasks(@PathVariable UUID episodeId);
 @PostMapping("/tasks/{taskId}/retry") ApiEnvelope<GenerationTaskResponse> retryTask(@PathVariable UUID taskId);
 @PostMapping("/tasks/{taskId}/cancel") ApiEnvelope<GenerationTaskResponse> cancelTask(@PathVariable UUID taskId);
}
