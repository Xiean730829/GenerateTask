package com.circus.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.RecordComponent;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

class CorePublicApiContractTest {

    @Test
    void envelopeUsesThePublishedApiErrorTypeInsteadOfObject() {
        RecordComponent error = java.util.Arrays.stream(com.circus.common.api.ApiEnvelope.class.getRecordComponents())
                .filter(component -> component.getName().equals("error"))
                .findFirst()
                .orElseThrow();

        assertEquals(com.circus.common.api.ApiErrorResponse.class, error.getType());
    }

    @Test
    void projectMaterialAndEpisodeApisReserveThePublishedPaths() throws Exception {
        Class<?> projectApi = Class.forName("com.circus.project.api.ProjectApi");
        Class<?> materialApi = Class.forName("com.circus.material.api.MaterialApi");
        Class<?> episodeApi = Class.forName("com.circus.episode.api.EpisodeApi");

        assertEquals("/api/projects", projectApi.getAnnotation(RequestMapping.class).value()[0]);
        assertEquals("/api", materialApi.getAnnotation(RequestMapping.class).value()[0]);
        assertEquals("/api", episodeApi.getAnnotation(RequestMapping.class).value()[0]);
        assertTrue(projectApi.getDeclaredMethod("createProject", Class.forName("com.circus.project.api.dto.CreateProjectRequest")) instanceof Method);
    }

    @Test
    void scriptAndShotApisReserveThePublishedPaths() throws Exception {
        Class<?> scriptApi = Class.forName("com.circus.script.api.ScriptApi");
        Class<?> shotApi = Class.forName("com.circus.shot.api.ShotApi");

        assertEquals("/api", scriptApi.getAnnotation(RequestMapping.class).value()[0]);
        assertEquals("/api", shotApi.getAnnotation(RequestMapping.class).value()[0]);
    }

    @Test
    void publicApiDeclaresEveryPublishedMediaAndExportOperation() throws Exception {
        Class<?> panelApi = Class.forName("com.circus.panel.api.PanelApi");
        Class<?> timelineApi = Class.forName("com.circus.timeline.api.TimelineApi");
        Class<?> exportApi = Class.forName("com.circus.export.api.ExportApi");

        assertMapping(panelApi, "listEpisodePanelVideos", GetMapping.class, "/episodes/{episodeId}/panel-videos");
        assertMapping(timelineApi, "createAudioSubtitleTask", PostMapping.class,
                "/episodes/{episodeId}/audio-subtitle-tasks");
        assertMapping(exportApi, "downloadExport", GetMapping.class, "/exports/{exportId}/download");
        assertEquals("org.springframework.http.ResponseEntity",
                exportApi.getDeclaredMethod("downloadExport", java.util.UUID.class).getReturnType().getName());
    }

    @Test
    void optionalBodiesAndReturnTypesMatchTheFrozenOpenApiContract() throws Exception {
        Class<?> shotApi = Class.forName("com.circus.shot.api.ShotApi");
        Class<?> assetApi = Class.forName("com.circus.asset.api.AssetApi");
        Class<?> panelApi = Class.forName("com.circus.panel.api.PanelApi");
        Class<?> timelineApi = Class.forName("com.circus.timeline.api.TimelineApi");
        Class<?> exportApi = Class.forName("com.circus.export.api.ExportApi");

        assertOptionalBody(shotApi, "createKeyframeBatch");
        assertReturnType(shotApi, "createKeyframeBatch", "KeyframeBatchResult");
        assertReturnType(shotApi, "deleteAssetOverride", "DeleteShotAssetOverrideResponse");
        assertOptionalBody(assetApi, "createRevision");
        assertReturnType(assetApi, "createRevision", "AssetResponse");
        assertOptionalBody(panelApi, "assemblePanels");
        assertOptionalBody(panelApi, "createVideoTask");
        assertOptionalBody(panelApi, "createBatchVideoTasks");
        assertOptionalBody(timelineApi, "composeTimeline");
        assertReturnType(timelineApi, "composeTimeline", "TimelineResponse");
        assertOptionalBody(exportApi, "createExport");
    }

    @Test
    void publicDtoShapesKeepThePublishedNestedMediaAndRevisionFields() throws Exception {
        assertRecordComponent("com.circus.media.api.dto.MediaFileResponse", "durationSeconds");
        assertRecordComponent("com.circus.media.api.dto.MediaFileResponse", "relatedObjectId");
        assertRecordComponent("com.circus.shot.api.dto.KeyframeResponse", "mediaFile");
        assertRecordComponent("com.circus.panel.api.dto.PanelVideoResponse", "mediaFile");
        assertRecordComponent("com.circus.asset.api.dto.AssetRevisionImpactResponse", "revision");
        assertRecordComponent("com.circus.asset.api.dto.AssetExtractTaskRequest", "episodeId");
        assertRecordComponent("com.circus.asset.api.dto.AssetReferenceResponse", "usage");
        assertRecordComponent("com.circus.shot.api.dto.KeyframeBatchResult", "shotIds");
        assertRecordComponent("com.circus.panel.api.dto.PanelRevisionResponse", "keyframeMediaIds");
        assertRecordComponent("com.circus.export.api.dto.CreateExportRequest", "resolution");
    }

    @Test
    void javaInterfacesCoverAllSixtyFrozenOpenApiOperations() {
        List<Class<?>> apiTypes = List.of(
                com.circus.project.api.ProjectApi.class,
                com.circus.material.api.MaterialApi.class,
                com.circus.episode.api.EpisodeApi.class,
                com.circus.script.api.ScriptApi.class,
                com.circus.shot.api.ShotApi.class,
                com.circus.asset.api.AssetApi.class,
                com.circus.panel.api.PanelApi.class,
                com.circus.timeline.api.TimelineApi.class,
                com.circus.export.api.ExportApi.class,
                com.circus.media.api.MediaFileApi.class,
                com.circus.task.api.TaskApi.class);

        long mappings = apiTypes.stream()
                .flatMap(api -> Arrays.stream(api.getDeclaredMethods()))
                .filter(method -> method.isAnnotationPresent(GetMapping.class)
                        || method.isAnnotationPresent(PostMapping.class)
                        || method.isAnnotationPresent(org.springframework.web.bind.annotation.PatchMapping.class)
                        || method.isAnnotationPresent(org.springframework.web.bind.annotation.DeleteMapping.class))
                .count();

        assertEquals(60, mappings);
    }

    private static void assertMapping(Class<?> api, String methodName,
                                      Class<? extends Annotation> annotationType, String path) {
        Method method = Arrays.stream(api.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals(methodName))
                .findFirst()
                .orElseThrow();
        if (annotationType == GetMapping.class) {
            assertEquals(path, method.getAnnotation(GetMapping.class).value()[0]);
        } else {
            assertEquals(path, method.getAnnotation(PostMapping.class).value()[0]);
        }
    }

    private static void assertOptionalBody(Class<?> api, String methodName) {
        Method method = Arrays.stream(api.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals(methodName))
                .findFirst()
                .orElseThrow();
        RequestBody requestBody = Arrays.stream(method.getParameters())
                .map(parameter -> parameter.getAnnotation(RequestBody.class))
                .filter(annotation -> annotation != null)
                .findFirst()
                .orElseThrow();
        assertTrue(!requestBody.required(), methodName + " must accept an omitted OpenAPI request body");
    }

    private static void assertReturnType(Class<?> api, String methodName, String expectedTypeName) {
        Type returnType = Arrays.stream(api.getDeclaredMethods())
                .filter(candidate -> candidate.getName().equals(methodName))
                .findFirst()
                .orElseThrow()
                .getGenericReturnType();
        assertTrue(returnType.getTypeName().contains(expectedTypeName),
                () -> methodName + " must expose " + expectedTypeName + " but was " + returnType.getTypeName());
    }

    private static void assertRecordComponent(String typeName, String componentName) throws Exception {
        assertTrue(Arrays.stream(Class.forName(typeName).getRecordComponents())
                .map(RecordComponent::getName)
                .anyMatch(componentName::equals), () -> typeName + " is missing " + componentName);
    }
}
