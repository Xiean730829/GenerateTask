package com.circus.task.api.web;

import com.circus.common.api.ApiEnvelope;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.api.dto.GenerationTaskResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

/** Thin HTTP adapter that delegates task creation to the stable command seam. */
@Component
public class TaskCommandHttpSupport {

    private final TaskCommandInterface taskCommands;
    private final TaskReadService taskReadService;
    private final ObjectMapper objectMapper;

    public TaskCommandHttpSupport(TaskCommandInterface taskCommands,
                                  TaskReadService taskReadService,
                                  ObjectMapper objectMapper) {
        this.taskCommands = taskCommands;
        this.taskReadService = taskReadService;
        this.objectMapper = objectMapper;
    }

    public JsonNode payload(Object request) {
        return request == null ? objectMapper.createObjectNode() : objectMapper.valueToTree(request);
    }

    public GenerationTaskResponse create(CreateTaskCommand command) {
        UUID taskId = taskCommands.create(command);
        GenerationTaskResponse response = taskReadService.find(taskId)
                .orElseGet(() -> pending(taskId, command));
        taskReadService.remember(response);
        return response;
    }

    public GenerationTaskResponse placeholder(UUID taskId) {
        Instant now = Instant.now();
        return new GenerationTaskResponse(taskId, null, null, null, null, null,
                "pending", 0, 0, null, null, null, null, null, now, now);
    }

    public ResponseEntity<ApiEnvelope<GenerationTaskResponse>> accepted(CreateTaskCommand command) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new ApiEnvelope<>(true, create(command), null));
    }

    private GenerationTaskResponse pending(UUID taskId, CreateTaskCommand command) {
        Instant now = Instant.now();
        return new GenerationTaskResponse(taskId, command.projectId(), command.episodeId(), command.shotId(),
                command.panelId(), command.taskType(), "pending", 0, 0, null, null, null,
                null, null, now, now);
    }
}
