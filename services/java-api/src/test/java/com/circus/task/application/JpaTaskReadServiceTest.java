package com.circus.task.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.circus.task.api.dto.GenerationTaskResponse;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JpaTaskReadServiceTest {

    private static final Instant NOW = Instant.parse("2026-07-15T00:00:00Z");

    private final GenerationTaskRepository taskRepository = org.mockito.Mockito.mock(GenerationTaskRepository.class);
    private final JpaTaskReadService readService = new JpaTaskReadService(taskRepository);

    @Test
    void mapsTheCurrentGenerationTaskRowWithoutReadingExecutionHistory() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId,
                projectId,
                episodeId,
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "script.generate",
                null,
                null,
                null,
                "trace-read",
                NOW,
                3);
        task.markQueued(NOW);
        task.markRunning(65, NOW);
        task.markSucceeded(JsonNodeFactory.instance.objectNode().put("scriptId", "script-1"), NOW);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        Optional<GenerationTaskResponse> result = readService.find(taskId);

        assertThat(result).isPresent();
        GenerationTaskResponse response = result.orElseThrow();
        assertThat(response.id()).isEqualTo(taskId);
        assertThat(response.projectId()).isEqualTo(projectId);
        assertThat(response.episodeId()).isEqualTo(episodeId);
        assertThat(response.taskType()).isEqualTo("script.generate");
        assertThat(response.status()).isEqualTo("succeeded");
        assertThat(response.attempt()).isZero();
        assertThat(response.progress()).isEqualTo(100);
        assertThat(response.resultRef()).isNull();
        verify(taskRepository).findById(taskId);
    }

    @Test
    void returnsEmptyWhenTheCurrentTaskRowDoesNotExist() {
        UUID taskId = UUID.randomUUID();
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        assertThat(readService.find(taskId)).isEmpty();
    }

    @Test
    void delegatesProjectAndEpisodeListsToCurrentRowQueries() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        GenerationTaskEntity task = GenerationTaskEntity.pending(
                UUID.randomUUID(),
                projectId,
                episodeId,
                null,
                null,
                JpaTaskStateStore.MS1_DEMO_OWNER_ID,
                "shot.generate",
                null,
                null,
                null,
                "trace-read",
                NOW,
                3);
        when(taskRepository.findByProjectIdOrderByUpdatedAtDescCreatedAtDesc(projectId))
                .thenReturn(List.of(task));
        when(taskRepository.findByEpisodeIdOrderByUpdatedAtDescCreatedAtDesc(episodeId))
                .thenReturn(List.of(task));

        assertThat(readService.findByProject(projectId)).hasSize(1);
        assertThat(readService.findByEpisode(episodeId)).hasSize(1);
        verify(taskRepository).findByProjectIdOrderByUpdatedAtDescCreatedAtDesc(projectId);
        verify(taskRepository).findByEpisodeIdOrderByUpdatedAtDescCreatedAtDesc(episodeId);
    }
}
