package com.circus.task.api.web;

import com.circus.common.api.ApiEnvelope;
import com.circus.task.api.TaskApi;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Public task query/retry/cancel adapter; business state remains in task services. */
@RestController
@RequestMapping("/api")
public class TaskQueryController implements TaskApi {

    private final TaskReadService taskReadService;
    private final TaskCommandInterface taskCommands;
    private final TaskCommandHttpSupport responseSupport;

    public TaskQueryController(TaskReadService taskReadService,
                               TaskCommandInterface taskCommands,
                               TaskCommandHttpSupport responseSupport) {
        this.taskReadService = taskReadService;
        this.taskCommands = taskCommands;
        this.responseSupport = responseSupport;
    }

    @Override
    @GetMapping("/tasks/{taskId}")
    public ApiEnvelope<GenerationTaskResponse> getTask(@PathVariable UUID taskId) {
        return success(taskReadService.find(taskId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found")));
    }

    @Override
    @GetMapping("/projects/{projectId}/tasks")
    public ApiEnvelope<List<GenerationTaskResponse>> listProjectTasks(@PathVariable UUID projectId) {
        return success(taskReadService.findByProject(projectId));
    }

    @Override
    @GetMapping("/episodes/{episodeId}/tasks")
    public ApiEnvelope<List<GenerationTaskResponse>> listEpisodeTasks(@PathVariable UUID episodeId) {
        return success(taskReadService.findByEpisode(episodeId));
    }

    @Override
    @PostMapping("/tasks/{taskId}/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiEnvelope<GenerationTaskResponse> retryTask(@PathVariable UUID taskId) {
        taskCommands.retry(taskId);
        return success(taskReadService.find(taskId).orElseGet(() -> responseSupport.placeholder(taskId)));
    }

    @Override
    @PostMapping("/tasks/{taskId}/cancel")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ApiEnvelope<GenerationTaskResponse> cancelTask(@PathVariable UUID taskId) {
        taskCommands.cancel(taskId);
        return success(taskReadService.find(taskId).orElseGet(() -> responseSupport.placeholder(taskId)));
    }

    private static <T> ApiEnvelope<T> success(T data) {
        return new ApiEnvelope<>(true, data, null);
    }
}
