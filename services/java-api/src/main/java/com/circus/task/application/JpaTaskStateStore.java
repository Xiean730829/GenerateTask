package com.circus.task.application;

import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.domain.GenerationTaskStateMachine;
import com.circus.task.domain.GenerationTaskStatus;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * PostgreSQL-backed owner of the current task row and its first execution identity.
 * MS1 has no authentication, so all tasks use the seeded demo user as owner.
 */
@Service
@ConditionalOnBean({GenerationTaskRepository.class, GenerationTaskExecutionRepository.class})
public class JpaTaskStateStore implements TaskStateStore {

    public static final UUID MS1_DEMO_OWNER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final int DEFAULT_MAX_RETRIES = 3;

    private final GenerationTaskRepository taskRepository;
    private final GenerationTaskExecutionRepository executionRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final GenerationTaskStateMachine stateMachine;

    @Autowired
    public JpaTaskStateStore(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            ObjectMapper objectMapper) {
        this(taskRepository, executionRepository, objectMapper, Clock.systemUTC());
    }

    JpaTaskStateStore(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            ObjectMapper objectMapper,
            Clock clock) {
        this(taskRepository, executionRepository, objectMapper, clock, new GenerationTaskStateMachine());
    }

    JpaTaskStateStore(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            ObjectMapper objectMapper,
            Clock clock,
            GenerationTaskStateMachine stateMachine) {
        this.taskRepository = taskRepository;
        this.executionRepository = executionRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.stateMachine = stateMachine;
    }

    @Override
    public Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        return taskRepository.findByOwnerUserIdAndIdempotencyOperationAndIdempotencyKey(
                        MS1_DEMO_OWNER_ID, taskType, idempotencyKey)
                .map(GenerationTaskEntity::id);
    }

    @Override
    @Transactional
    public TaskDispatch createPending(CreateTaskCommand command) {
        validateCreateCommand(command);
        Instant now = clock.instant();
        UUID taskId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        String traceId = UUID.randomUUID().toString();
        String idempotencyKey = normalize(command.idempotencyKey());
        String operation = idempotencyKey == null ? null : command.taskType();
        String fingerprint = idempotencyKey == null ? null : fingerprint(command);

        GenerationTaskEntity task = GenerationTaskEntity.pending(
                taskId,
                command.projectId(),
                command.episodeId(),
                command.shotId(),
                command.panelId(),
                MS1_DEMO_OWNER_ID,
                command.taskType(),
                idempotencyKey,
                operation,
                fingerprint,
                traceId,
                now,
                DEFAULT_MAX_RETRIES);
        JsonNode payloadSnapshot = command.payload().deepCopy();
        GenerationTaskExecutionEntity execution = GenerationTaskExecutionEntity.queued(
                messageId, taskId, 0, traceId, payloadSnapshot, now);
        taskRepository.save(task);
        executionRepository.save(execution);
        return new TaskDispatch(messageId, taskId, command, 0, traceId, now);
    }

    @Override
    @Transactional
    public TaskDispatch retry(UUID taskId) {
        GenerationTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found: " + taskId));
        if (task.retryable() == null || !task.retryable()) {
            throw new IllegalStateException("task is not retryable: " + taskId);
        }
        if (task.retryCount() >= task.maxRetries()) {
            throw new IllegalStateException("task retry limit exceeded: " + taskId);
        }
        stateMachine.transition(statusOf(task.status()), GenerationTaskStatus.RETRYING);
        GenerationTaskExecutionEntity previousExecution = executionRepository
                .findByTaskIdAndAttempt(taskId, task.attempt())
                .orElseThrow(() -> new IllegalStateException("task execution not found: " + taskId));

        Instant now = clock.instant();
        String traceId = UUID.randomUUID().toString();
        int nextAttempt = task.attempt() + 1;
        UUID messageId = UUID.randomUUID();
        task.beginRetry(traceId, now);
        CreateTaskCommand command = new CreateTaskCommand(
                task.taskType(),
                task.projectId(),
                task.episodeId(),
                task.shotId(),
                task.panelId(),
                previousExecution.payloadSnapshot().deepCopy(),
                task.idempotencyKey());
        GenerationTaskExecutionEntity execution = GenerationTaskExecutionEntity.queued(
                messageId,
                taskId,
                nextAttempt,
                traceId,
                command.payload().deepCopy(),
                now);
        taskRepository.save(task);
        executionRepository.save(execution);
        return new TaskDispatch(messageId, taskId, command, nextAttempt, traceId, now);
    }

    @Override
    @Transactional
    public void cancel(UUID taskId) {
        GenerationTaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("task not found: " + taskId));
        stateMachine.transition(statusOf(task.status()), GenerationTaskStatus.CANCELED);
        task.cancel(clock.instant());
        taskRepository.save(task);
    }

    private String fingerprint(CreateTaskCommand command) {
        String material = command.taskType() + "\n"
                + command.projectId() + "\n"
                + command.episodeId() + "\n"
                + command.shotId() + "\n"
                + command.panelId() + "\n"
                + command.payload();
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is required by the task contract", exception);
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private void validateCreateCommand(CreateTaskCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("create task command is required");
        }
        if (command.taskType() == null || command.taskType().isBlank()) {
            throw new IllegalArgumentException("taskType is required");
        }
        if (command.projectId() == null) {
            throw new IllegalArgumentException("projectId is required");
        }
        if (command.episodeId() == null) {
            throw new IllegalArgumentException("episodeId is required");
        }
        if (command.payload() == null) {
            throw new IllegalArgumentException("payload is required");
        }
    }

    private GenerationTaskStatus statusOf(String wireValue) {
        for (GenerationTaskStatus status : GenerationTaskStatus.values()) {
            if (status.wireValue().equals(wireValue)) {
                return status;
            }
        }
        throw new IllegalStateException("unknown task status: " + wireValue);
    }
}
