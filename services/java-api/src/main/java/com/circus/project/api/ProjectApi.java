package com.circus.project.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.project.api.dto.CreateProjectRequest;
import com.circus.project.api.dto.CreateProjectResultResponse;
import com.circus.project.api.dto.ProjectResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/projects")
public interface ProjectApi {
    @PostMapping
    ApiEnvelope<CreateProjectResultResponse> createProject(@Valid @RequestBody CreateProjectRequest request);

    @GetMapping
    ApiEnvelope<List<ProjectResponse>> listProjects();

    @GetMapping("/{projectId}")
    ApiEnvelope<ProjectResponse> getProject(@PathVariable UUID projectId);
}
