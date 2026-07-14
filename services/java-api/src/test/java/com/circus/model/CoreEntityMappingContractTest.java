package com.circus.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** JPA 映射护栏：锁定 Java 字段到 Flyway 表/列的名称与 JSON 类型。 */
class CoreEntityMappingContractTest {

    @Test
    void coreEntitiesExposeThePersistedTableAndColumnNames() throws Exception {
        Class<?> project = load("com.circus.project.domain.ProjectEntity");
        Class<?> episode = load("com.circus.episode.domain.EpisodeEntity");
        Class<?> material = load("com.circus.material.domain.SourceMaterialEntity");
        Class<?> script = load("com.circus.script.domain.ScriptEntity");
        Class<?> shot = load("com.circus.shot.domain.ShotEntity");
        Class<?> promptRevision = load("com.circus.shot.domain.ShotPromptRevisionEntity");

        assertEquals("project", project.getAnnotation(Table.class).name());
        assertEquals("default_episode_id", columnName(project, "defaultEpisodeId"));
        assertEquals("episode", episode.getAnnotation(Table.class).name());
        assertEquals("project_id", columnName(episode, "projectId"));
        assertEquals("source_material", material.getAnnotation(Table.class).name());
        assertEquals("source_media_file_id", columnName(material, "sourceMediaFileId"));
        assertEquals("script", script.getAnnotation(Table.class).name());
        assertEquals("story_promise", columnName(script, "storyPromise"));
        assertEquals("shot", shot.getAnnotation(Table.class).name());
        assertEquals("current_prompt_revision_id", columnName(shot, "currentPromptRevisionId"));
        assertEquals("scene_index", columnName(shot, "sceneIndex"));
        assertEquals("environment_description", columnName(shot, "environmentDescription"));
        assertEquals("character_instances", columnName(shot, "characterInstances"));
        assertEquals("prop_instances", columnName(shot, "propInstances"));
        assertEquals("end_state", columnName(shot, "endState"));
        assertEquals("dialogues", columnName(shot, "dialogues"));
        assertEquals("camera_description", columnName(shot, "cameraDescription"));
        assertEquals("audio_description", columnName(shot, "audioDescription"));
        assertEquals("continuity_locks", columnName(shot, "continuityLocks"));
        assertEquals("shot_prompt_revision", promptRevision.getAnnotation(Table.class).name());
        assertEquals("asset_overrides_snapshot", columnName(promptRevision, "assetOverridesSnapshot"));
    }

    @Test
    void assetAndMediaEntitiesExposeThePersistedTableAndColumnNames() throws Exception {
        Class<?> asset = load("com.circus.asset.domain.AssetEntity");
        Class<?> assetReference = load("com.circus.asset.domain.AssetReferenceEntity");
        Class<?> assetImage = load("com.circus.asset.domain.AssetReferenceImageEntity");
        Class<?> override = load("com.circus.shot.domain.ShotAssetOverrideEntity");
        Class<?> mediaFile = load("com.circus.media.domain.MediaFileEntity");
        Class<?> keyframe = load("com.circus.shot.domain.KeyframeEntity");

        assertEquals("asset", asset.getAnnotation(Table.class).name());
        assertEquals("reference_image_media_file_id", columnName(asset, "referenceImageMediaFileId"));
        assertEquals("asset_reference", assetReference.getAnnotation(Table.class).name());
        assertEquals("project_id", columnName(assetReference, "projectId"));
        assertEquals("asset_reference_image", assetImage.getAnnotation(Table.class).name());
        assertEquals("media_file_id", columnName(assetImage, "mediaFileId"));
        assertEquals("shot_asset_override", override.getAnnotation(Table.class).name());
        assertEquals("attributes", columnName(override, "attributes"));
        assertEquals("media_file", mediaFile.getAnnotation(Table.class).name());
        assertEquals("object_key", columnName(mediaFile, "objectKey"));
        assertEquals("keyframe", keyframe.getAnnotation(Table.class).name());
        assertEquals("prompt_revision_id", columnName(keyframe, "promptRevisionId"));
    }

    /** @Test：同时验证 GenerationTask 保持当前状态职责，execution 才持有 messageId 历史。 */
    @Test
    void productionEntitiesExposeThePersistedTableAndColumnNames() throws Exception {
        Class<?> panel = load("com.circus.panel.domain.PanelEntity");
        Class<?> revision = load("com.circus.panel.domain.PanelRevisionEntity");
        Class<?> video = load("com.circus.panel.domain.PanelVideoEntity");
        Class<?> task = load("com.circus.task.domain.GenerationTaskEntity");
        Class<?> taskExecution = load("com.circus.task.domain.GenerationTaskExecutionEntity");
        Class<?> timeline = load("com.circus.timeline.domain.TimelineEntity");
        Class<?> export = load("com.circus.export.domain.ExportEntity");

        assertEquals("panel", panel.getAnnotation(Table.class).name());
        assertEquals("current_revision_id", columnName(panel, "currentRevisionId"));
        assertEquals("panel_revision", revision.getAnnotation(Table.class).name());
        assertEquals("keyframe_media_ids", columnName(revision, "keyframeMediaIds"));
        assertEquals("panel_video", video.getAnnotation(Table.class).name());
        assertEquals("panel_revision_id", columnName(video, "panelRevisionId"));
        assertEquals("generation_task", task.getAnnotation(Table.class).name());
        assertEquals("idempotency_operation", columnName(task, "idempotencyOperation"));
        assertThrows(NoSuchFieldException.class, () -> task.getDeclaredField("messageId"));
        assertEquals("generation_task_execution", taskExecution.getAnnotation(Table.class).name());
        assertTrue(field(taskExecution, "messageId").isAnnotationPresent(Id.class));
        assertEquals("message_id", columnName(taskExecution, "messageId"));
        assertEquals("task_id", columnName(taskExecution, "taskId"));
        assertEquals("attempt", columnName(taskExecution, "attempt"));
        assertEquals("trace_id", columnName(taskExecution, "traceId"));
        assertEquals("payload_snapshot", columnName(taskExecution, "payloadSnapshot"));
        assertEquals("status", columnName(taskExecution, "status"));
        assertEquals("result_json", columnName(taskExecution, "resultJson"));
        assertEquals("error_code", columnName(taskExecution, "errorCode"));
        assertEquals("error_message", columnName(taskExecution, "errorMessage"));
        assertEquals("created_at", columnName(taskExecution, "createdAt"));
        assertEquals("published_at", columnName(taskExecution, "publishedAt"));
        assertEquals("started_at", columnName(taskExecution, "startedAt"));
        assertEquals("finished_at", columnName(taskExecution, "finishedAt"));
        assertEquals("updated_at", columnName(taskExecution, "updatedAt"));
        assertEquals(SqlTypes.JSON, field(taskExecution, "payloadSnapshot").getAnnotation(JdbcTypeCode.class).value());
        assertEquals(SqlTypes.JSON, field(taskExecution, "resultJson").getAnnotation(JdbcTypeCode.class).value());
        assertEquals("timeline", timeline.getAnnotation(Table.class).name());
        assertEquals("video_track", columnName(timeline, "videoTrack"));
        assertEquals("export", export.getAnnotation(Table.class).name());
        assertEquals("timeline_id", columnName(export, "timelineId"));
    }

    private static Class<?> load(String name) throws ClassNotFoundException {
        return Class.forName(name);
    }

    private static String columnName(Class<?> type, String fieldName) throws NoSuchFieldException {
        Field field = field(type, fieldName);
        Column column = field.getAnnotation(Column.class);
        assertTrue(column != null, () -> type.getSimpleName() + "." + fieldName + " must declare @Column");
        return column.name();
    }

    private static Field field(Class<?> type, String fieldName) throws NoSuchFieldException {
        return type.getDeclaredField(fieldName);
    }
}
