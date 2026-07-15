package com.circus.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.circus.task.api.TaskReadService;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.application.JpaTaskStateStore;
import com.circus.task.application.TaskDispatch;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Real PostgreSQL query coverage for the current GenerationTask read model. */
@SpringBootTest
@ActiveProfiles("integration")
class TaskReadServicePostgresIT {

    @Autowired
    private TaskReadService readService;

    @Autowired
    private JpaTaskStateStore store;

    @Autowired
    private GenerationTaskRepository taskRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void readsCurrentTasksByIdProjectAndEpisodeWithStableListOrdering() {
        Scope scope = seedScope();
        TaskDispatch first = store.createPending(command(scope, "script.generate", "read-script"));
        TaskDispatch second = store.createPending(command(scope, "shot.generate", "read-shot"));
        entityManager.flush();
        entityManager.clear();

        assertThat(readService.find(first.taskId())).isPresent()
                .get()
                .extracting(task -> task.id())
                .isEqualTo(first.taskId());
        List<com.circus.task.api.dto.GenerationTaskResponse> projectTasks = readService.findByProject(scope.projectId());
        List<com.circus.task.api.dto.GenerationTaskResponse> episodeTasks = readService.findByEpisode(scope.episodeId());
        assertThat(projectTasks).hasSize(2);
        assertThat(episodeTasks).extracting(task -> task.id()).containsExactlyElementsOf(
                projectTasks.stream().map(task -> task.id()).toList());
        assertThat(projectTasks).extracting(task -> task.updatedAt())
                .isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(readService.findByProject(UUID.randomUUID())).isEmpty();
        assertThat(readService.findByEpisode(UUID.randomUUID())).isEmpty();
        assertThat(taskRepository.findById(second.taskId())).isPresent();
    }

    private Scope seedScope() {
        UUID projectId = UUID.randomUUID();
        UUID episodeId = UUID.randomUUID();
        jdbcTemplate.update(
                "insert into project (id, owner_user_id, name, project_type, stage, default_episode_id) "
                        + "values (?, ?, ?, 'single_episode', 'material', ?)",
                projectId, JpaTaskStateStore.MS1_DEMO_OWNER_ID, "read-project", episodeId);
        jdbcTemplate.update(
                "insert into episode (id, project_id, title, order_index, status) values (?, ?, ?, 0, 'created')",
                episodeId, projectId, "read-episode");
        return new Scope(projectId, episodeId);
    }

    private CreateTaskCommand command(Scope scope, String taskType, String key) {
        return new CreateTaskCommand(taskType, scope.projectId(), scope.episodeId(), null, null,
                JsonNodeFactory.instance.objectNode().put("sourceText", "read"), key);
    }

    private record Scope(UUID projectId, UUID episodeId) {}
}
