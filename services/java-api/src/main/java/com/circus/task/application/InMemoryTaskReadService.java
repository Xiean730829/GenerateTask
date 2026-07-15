package com.circus.task.application;

import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Process-local fallback used only when database-backed services are disabled. */
class InMemoryTaskReadService implements TaskReadService {

    private final Map<UUID, GenerationTaskResponse> tasks = new ConcurrentHashMap<>();

    @Override
    public Optional<GenerationTaskResponse> find(UUID taskId) {
        return Optional.ofNullable(tasks.get(taskId));
    }

    @Override
    public List<GenerationTaskResponse> findByProject(UUID projectId) {
        return tasks.values().stream()
                .filter(task -> projectId.equals(task.projectId()))
                .toList();
    }

    @Override
    public List<GenerationTaskResponse> findByEpisode(UUID episodeId) {
        return tasks.values().stream()
                .filter(task -> episodeId.equals(task.episodeId()))
                .toList();
    }

    @Override
    public void remember(GenerationTaskResponse response) {
        tasks.put(response.id(), response);
    }
}
