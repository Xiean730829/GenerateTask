package com.circus.task.api.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.circus.common.api.ApiEnvelope;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.GenerationTaskResponse;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class TaskQueryControllerTest {

    private final TaskReadService reads = mock(TaskReadService.class);
    private final TaskCommandInterface commands = mock(TaskCommandInterface.class);
    private final TaskCommandHttpSupport responseSupport = mock(TaskCommandHttpSupport.class);
    private final TaskQueryController controller = new TaskQueryController(reads, commands, responseSupport);

    @Test
    void returnsCurrentTaskAndListsFromReadService() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        GenerationTaskResponse task = response(taskId, projectId, episodeId);
        when(reads.find(taskId)).thenReturn(Optional.of(task));
        when(reads.findByProject(projectId)).thenReturn(List.of(task));
        when(reads.findByEpisode(episodeId)).thenReturn(List.of(task));

        assertThat(controller.getTask(taskId).data()).isEqualTo(task);
        assertThat(controller.listProjectTasks(projectId).data()).containsExactly(task);
        assertThat(controller.listEpisodeTasks(episodeId).data()).containsExactly(task);
        verify(reads).find(taskId);
        verify(reads).findByProject(projectId);
        verify(reads).findByEpisode(episodeId);
    }

    @Test
    void returnsNotFoundWhenCurrentTaskDoesNotExist() {
        UUID taskId = UUID.randomUUID();
        when(reads.find(taskId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getTask(taskId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void delegatesRetryAndCancelWithoutReadingExecutionHistory() {
        UUID taskId = UUID.randomUUID();
        GenerationTaskResponse task = response(taskId, UUID.randomUUID(), UUID.randomUUID());
        when(reads.find(taskId)).thenReturn(Optional.of(task));

        ApiEnvelope<GenerationTaskResponse> retry = controller.retryTask(taskId);
        ApiEnvelope<GenerationTaskResponse> cancel = controller.cancelTask(taskId);

        assertThat(retry.data()).isEqualTo(task);
        assertThat(cancel.data()).isEqualTo(task);
        verify(commands).retry(taskId);
        verify(commands).cancel(taskId);
    }

    private GenerationTaskResponse response(UUID taskId, UUID projectId, UUID episodeId) {
        Instant now = Instant.parse("2026-07-15T00:00:00Z");
        return new GenerationTaskResponse(taskId, projectId, episodeId, null, null,
                "script.generate", "queued", 0, 0, null, null, null, null, null, now, now);
    }
}
