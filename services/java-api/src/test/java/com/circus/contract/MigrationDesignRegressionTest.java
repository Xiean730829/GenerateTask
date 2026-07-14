package com.circus.contract;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class MigrationDesignRegressionTest {

    private static final Path REPOSITORY_ROOT = Path.of("../..").toAbsolutePath().normalize();

    @Test
    void taskMigrationImplementsThePublishedIdempotencyScopeAndEpisodeOwnership() throws IOException {
        String taskMigration = read("services/java-api/src/main/resources/db/migration/V2__generation_task.sql");
        String businessMigration = read("services/java-api/src/main/resources/db/migration/V3__business_tables.sql");

        assertFalse(taskMigration.contains("on generation_task (task_type, idempotency_key)"));
        assertTrue(businessMigration.contains("idempotency_operation"));
        assertTrue(businessMigration.contains("request_fingerprint"));
        assertTrue(businessMigration.contains("uq_gen_task_idempotency_scope"));
        assertTrue(businessMigration.contains("fk_gen_task_project_episode"));
        assertTrue(businessMigration.contains("foreign key (project_id, episode_id)"));
    }

    @Test
    void businessMigrationPreservesRevisionOwnershipAndMediaSelectionInTheDatabase() throws IOException {
        String migration = read("services/java-api/src/main/resources/db/migration/V3__business_tables.sql");

        assertTrue(migration.contains("asset_overrides_snapshot"));
        assertTrue(migration.contains("asset_reference_image"));
        assertTrue(migration.contains("panel_shot"));
        assertTrue(migration.contains("uq_keyframe_selected_per_shot"));
        assertTrue(migration.contains("fk_shot_current_prompt_revision_owner"));
        assertTrue(migration.contains("fk_asset_current_revision_owner"));
        assertTrue(migration.contains("fk_panel_current_revision_owner"));
        assertTrue(migration.contains("fk_panel_video_revision_owner"));
    }

    @Test
    void shotStructureExpansionUsesANewFlywayMigrationAndKeepsFullLocalState() throws IOException {
        Path migrationPath = REPOSITORY_ROOT.resolve(
                "services/java-api/src/main/resources/db/migration/V4__expand_shot_structure.sql");

        assertTrue(Files.exists(migrationPath), "Shot expansion must not rewrite an applied V3 migration");
        String migration = Files.readString(migrationPath);
        assertTrue(migration.contains("scene_index"));
        assertTrue(migration.contains("environment_description"));
        assertTrue(migration.contains("character_instances jsonb"));
        assertTrue(migration.contains("prop_instances jsonb"));
        assertTrue(migration.contains("end_state text"));
        assertTrue(migration.contains("dialogues jsonb"));
        assertTrue(migration.contains("camera_description text"));
        assertTrue(migration.contains("audio_description text"));
        assertTrue(migration.contains("continuity_locks jsonb"));
        assertTrue(migration.contains("idx_shot_episode_scene_order"));
    }

    @Test
    void generationTaskExecutionUsesANewMigrationAndPersistsImmutableDispatchIdentity() throws IOException {
        Path migrationPath = REPOSITORY_ROOT.resolve(
                "services/java-api/src/main/resources/db/migration/V5__add_generation_task_execution.sql");

        assertTrue(Files.exists(migrationPath), "Execution identity must not rewrite an applied migration");
        String migration = Files.readString(migrationPath);
        assertTrue(migration.contains("create table generation_task_execution"));
        assertTrue(migration.contains("message_id       uuid         primary key"));
        assertTrue(migration.contains("task_id          uuid         not null"));
        assertTrue(migration.contains("attempt          integer      not null"));
        assertTrue(migration.contains("payload_snapshot jsonb        not null"));
        assertTrue(migration.contains("status           varchar(16)  not null default 'queued'"));
        assertTrue(migration.contains("result_json      jsonb"));
        assertTrue(migration.contains("error_code       varchar(128)"));
        assertTrue(migration.contains("error_message    text"));
        assertTrue(migration.contains("published_at     timestamptz"));
        assertTrue(migration.contains("foreign key (task_id) references generation_task (id)"));
        assertTrue(migration.contains("unique (task_id, attempt)"));
        assertTrue(migration.contains("ck_gen_task_execution_attempt check (attempt >= 0)"));
        assertTrue(migration.contains("idx_gen_task_execution_task_attempt"));
        assertTrue(migration.contains("prevent_generation_task_execution_dispatch_mutation"));
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath));
    }
}
