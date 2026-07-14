package com.circus.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.Column;
import jakarta.persistence.Table;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

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

    @Test
    void productionEntitiesExposeThePersistedTableAndColumnNames() throws Exception {
        Class<?> panel = load("com.circus.panel.domain.PanelEntity");
        Class<?> revision = load("com.circus.panel.domain.PanelRevisionEntity");
        Class<?> video = load("com.circus.panel.domain.PanelVideoEntity");
        Class<?> task = load("com.circus.task.domain.GenerationTaskEntity");
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
        assertEquals("timeline", timeline.getAnnotation(Table.class).name());
        assertEquals("video_track", columnName(timeline, "videoTrack"));
        assertEquals("export", export.getAnnotation(Table.class).name());
        assertEquals("timeline_id", columnName(export, "timelineId"));
    }

    private static Class<?> load(String name) throws ClassNotFoundException {
        return Class.forName(name);
    }

    private static String columnName(Class<?> type, String fieldName) throws NoSuchFieldException {
        Field field = type.getDeclaredField(fieldName);
        Column column = field.getAnnotation(Column.class);
        assertTrue(column != null, () -> type.getSimpleName() + "." + fieldName + " must declare @Column");
        return column.name();
    }
}
