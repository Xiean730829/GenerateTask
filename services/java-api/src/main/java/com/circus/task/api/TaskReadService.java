package com.circus.task.api;

import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Read seam for the current GenerationTask row.
 * Implementations must not reconstruct current state from execution history.
 */
public interface TaskReadService {

    Optional<GenerationTaskResponse> find(UUID taskId);

    List<GenerationTaskResponse> findByProject(UUID projectId);

    List<GenerationTaskResponse> findByEpisode(UUID episodeId);

    /** Only the in-memory HTTP fallback uses this hook. */
    default void remember(GenerationTaskResponse response) {}
}
