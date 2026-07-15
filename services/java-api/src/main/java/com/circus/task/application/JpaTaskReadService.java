package com.circus.task.application;

import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.GenerationTaskResponse;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.infrastructure.GenerationTaskRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/** PostgreSQL-backed read model for the current generation_task rows. */
@Service
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class JpaTaskReadService implements TaskReadService {

    private final GenerationTaskRepository taskRepository;

    public JpaTaskReadService(GenerationTaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Override
    public Optional<GenerationTaskResponse> find(UUID taskId) {
        return taskRepository.findById(taskId).map(this::toResponse);
    }

    @Override
    public List<GenerationTaskResponse> findByProject(UUID projectId) {
        return taskRepository.findByProjectIdOrderByUpdatedAtDescCreatedAtDesc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<GenerationTaskResponse> findByEpisode(UUID episodeId) {
        return taskRepository.findByEpisodeIdOrderByUpdatedAtDescCreatedAtDesc(episodeId).stream()
                .map(this::toResponse)
                .toList();
    }

    private GenerationTaskResponse toResponse(GenerationTaskEntity task) {
        return new GenerationTaskResponse(
                task.id(),
                task.projectId(),
                task.episodeId(),
                task.shotId(),
                task.panelId(),
                task.taskType(),
                task.status(),
                task.attempt(),
                task.progress(),
                task.errorCode(),
                task.errorMessage(),
                task.retryable(),
                task.resultRef(),
                task.costPoints(),
                task.createdAt(),
                task.updatedAt());
    }
}
