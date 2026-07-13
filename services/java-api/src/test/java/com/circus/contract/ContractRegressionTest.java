package com.circus.contract;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/** Guards the MS1 contract decisions that must not drift from the architecture. */
class ContractRegressionTest {

    private static final Path REPOSITORY_ROOT = Path.of("../..").toAbsolutePath().normalize();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void assetSchemaKeepsVoiceAsACharacterAttribute() throws IOException {
        String schema = read("packages/contracts/json-schema/business/asset.schema.json");

        assertFalse(schema.contains("\"voice\""), "voice must not be an independent Asset type");
    }

    @Test
    void assetSchemaTreatsPropAsAnMs1AssetType() throws IOException {
        JsonNode asset = json("packages/contracts/json-schema/business/asset.schema.json");
        JsonNode reference = json("packages/contracts/json-schema/business/asset-reference.schema.json");

        assertTrue(asset.path("properties").path("type").path("enum").toString().contains("\"prop\""));
        assertTrue(reference.path("properties").path("usage").path("enum").toString().contains("\"prop\""));
    }

    @Test
    void publicContractDoesNotAcceptAnIndependentVoiceAssetReference() throws IOException {
        String contract = read("packages/contracts/openapi/openapi-public.yaml");

        assertFalse(contract.contains("voiceAssetId"), "voice must be read from the character Asset attributes");
    }

    @Test
    void taskMessagePayloadRequiresSourceTextAndProjectConfig() throws IOException {
        JsonNode payload = json("packages/contracts/json-schema/generation-spec/task-execution.schema.json")
                .path("properties")
                .path("payload");

        assertTrue(payload.path("required").toString().contains("\"sourceText\""));
        assertTrue(payload.path("required").toString().contains("\"projectConfig\""));
        assertTrue("string".equals(payload.path("properties").path("sourceText").path("type").asText()));
        assertTrue("object".equals(payload.path("properties").path("projectConfig").path("type").asText()));
    }

    @Test
    void failedTaskResultRequiresRetryabilityAndWorkerIdentity() throws IOException {
        JsonNode schema = json("packages/contracts/json-schema/generation-spec/task-result.schema.json");
        JsonNode error = schema.path("properties").path("error");
        JsonNode worker = schema.path("properties").path("worker");

        assertTrue(error.path("required").toString().contains("\"retryable\""));
        assertTrue("boolean".equals(error.path("properties").path("retryable").path("type").asText()));
        assertTrue(worker.path("required").toString().contains("\"name\""));
        assertTrue(worker.path("required").toString().contains("\"version\""));
    }

    @Test
    void taskResultsAndPersistedTasksRetainRetryDecisionContext() throws IOException {
        JsonNode taskResult = json("packages/contracts/json-schema/generation-spec/task-result.schema.json");
        JsonNode generationTask = json("packages/contracts/json-schema/business/generation-task.schema.json");

        assertTrue(taskResult.path("required").toString().contains("\"episodeId\""));
        assertTrue(generationTask.path("properties").has("retryable"));
    }

    @Test
    void everyGenerationTaskRequiresANonNullEpisode() throws IOException {
        JsonNode schema = json("packages/contracts/json-schema/business/generation-task.schema.json");

        assertTrue(schema.path("required").toString().contains("\"episodeId\""));
        assertTrue(schema.path("properties").path("episodeId").path("type").isTextual());
        assertTrue("string".equals(schema.path("properties").path("episodeId").path("type").asText()));
    }

    @Test
    void publicContractExposesPromptRevisionsAndPanelVideoTasks() throws IOException {
        String contract = read("packages/contracts/openapi/openapi-public.yaml");

        assertTrue(contract.contains("/api/shots/{shotId}/prompt-revisions:"));
        assertTrue(contract.contains("/api/panels/{panelId}/video-tasks:"));
        assertFalse(contract.contains("/api/episodes/{episodeId}/video-tasks/batch:"));
    }

    @Test
    void publicContractExposesTheMs1WorkstationMediaFlow() throws IOException {
        String contract = read("packages/contracts/openapi/openapi-public.yaml");

        assertTrue(contract.contains("/api/shots/{shotId}/keyframe-tasks:"));
        assertTrue(contract.contains("/api/episodes/{episodeId}/keyframe-tasks/batch:"));
        assertTrue(contract.contains("/api/episodes/{episodeId}/keyframes:"));
        assertTrue(contract.contains("/api/episodes/{episodeId}/panels:"));
        assertTrue(contract.contains("/api/episodes/{episodeId}/panel-video-tasks/batch:"));
        assertTrue(contract.contains("/api/panels/{panelId}/videos:"));
    }

    @Test
    void publicContractSupportsEpisodeWorkspaceRecoveryAndEditing() throws IOException {
        String contract = read("packages/contracts/openapi/openapi-public.yaml");

        assertTrue(contract.contains("/api/episodes/{episodeId}:"));
        assertTrue(contract.contains("/api/episodes/{episodeId}/tasks:"));
        assertTrue(contract.contains("/api/scripts/{scriptId}:"));
        assertTrue(contract.contains("/api/shots/{shotId}:"));
        assertTrue(contract.contains("/api/shots/{shotId}/asset-overrides:"));
        assertTrue(contract.contains("/api/materials/{materialId}:"));
    }

    @Test
    void asyncContractDefinesEpisodeTaskUpdates() throws IOException {
        String asyncApi = read("packages/contracts/asyncapi/asyncapi.yaml");
        Path eventSchemaPath = REPOSITORY_ROOT.resolve(
                "packages/contracts/json-schema/generation-spec/task-updated-event.schema.json");

        assertTrue(asyncApi.contains("/api/ws/episodes/{episodeId}"));
        assertTrue(asyncApi.contains("task.updated"));
        assertTrue(Files.exists(eventSchemaPath));
        JsonNode event = OBJECT_MAPPER.readTree(Files.readString(eventSchemaPath));
        assertTrue(event.path("properties").path("data").path("required").toString().contains("\"episodeId\""));
        assertTrue(event.path("properties").path("data").path("required").toString().contains("\"error\""));
    }

    @Test
    void defaultHealthResponseDoesNotExposeInfrastructureDetails() throws IOException {
        String application = read("services/java-api/src/main/resources/application.yml");

        assertTrue(application.contains("show-details: never"));
    }

    @Test
    void localComposeIsReproducibleAndDoesNotClaimGlobalContainerNames() throws IOException {
        String compose = read("infra/compose/local/docker-compose.yaml");

        assertFalse(compose.contains("container_name:"));
        assertFalse(compose.contains(":latest"));
    }

    @Test
    void localComposeUsesTheIssueTenRabbitMqMajorVersion() throws IOException {
        String compose = read("infra/compose/local/docker-compose.yaml");

        assertTrue(compose.contains("image: rabbitmq:4-management-alpine"));
    }

    private static JsonNode json(String relativePath) throws IOException {
        return OBJECT_MAPPER.readTree(read(relativePath));
    }

    private static String read(String relativePath) throws IOException {
        return Files.readString(REPOSITORY_ROOT.resolve(relativePath));
    }
}
