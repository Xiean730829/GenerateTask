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

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath));
    }
}
