package com.circus.task.internal;

import com.circus.task.api.event.TaskErrorSnapshot;
import com.circus.task.api.event.TaskFailedEvent;
import com.circus.task.api.event.TaskRunningEvent;
import com.circus.task.api.event.TaskSucceededEvent;
import com.circus.task.application.JpaTaskStateStore;
import com.circus.task.domain.GenerationTaskEntity;
import com.circus.task.domain.GenerationTaskExecutionEntity;
import com.circus.task.domain.GenerationTaskStateMachine;
import com.circus.task.domain.GenerationTaskStatus;
import com.circus.task.infrastructure.GenerationTaskExecutionRepository;
import com.circus.task.infrastructure.GenerationTaskRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Java-owned callback boundary for Python Worker results.
 *
 * <p>The immutable execution identity is checked before the current task row
 * changes. Lifecycle events are published inside this transaction and are
 * consumed by {@code @TransactionalEventListener(AFTER_COMMIT)} subscribers.</p>
 */
@Service
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class GenerationTaskCallbackService implements TaskCallbackService {

    private final GenerationTaskRepository taskRepository;
    private final GenerationTaskExecutionRepository executionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;
    private final GenerationTaskStateMachine stateMachine = new GenerationTaskStateMachine();

    @Autowired
    public GenerationTaskCallbackService(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            ApplicationEventPublisher eventPublisher) {
        this(taskRepository, executionRepository, eventPublisher, Clock.systemUTC());
    }

    GenerationTaskCallbackService(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            ApplicationEventPublisher eventPublisher,
            Clock clock) {
        this.taskRepository = taskRepository;
        this.executionRepository = executionRepository;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Override
    @Transactional
    public TaskResultAcknowledgement handle(TaskResult result) {
        if (!hasIdentity(result) || !hasValidPayload(result)) {
            return ignored(result);
        }

        Optional<GenerationTaskExecutionEntity> executionOptional = executionRepository.findById(result.messageId());
        if (executionOptional.isEmpty()) {
            return ignored(result);
        }
        GenerationTaskExecutionEntity execution = executionOptional.get();
        if (!result.taskId().equals(execution.taskId())
                || !result.attempt().equals(execution.attempt())) {
            return ignored(result);
        }

        Optional<GenerationTaskEntity> taskOptional = taskRepository.findById(result.taskId());
        if (taskOptional.isEmpty()) {
            return ignored(result);
        }
        GenerationTaskEntity task = taskOptional.get();
        if (!result.episodeId().equals(task.episodeId())
                || !result.attempt().equals(task.attempt())) {
            return ignored(result);
        }

        GenerationTaskStatus current = statusOf(task.status());
        Instant now = clock.instant();
        if ("running".equals(result.status())) {
            return handleRunning(result, task, execution, current, now);
        }
        if ("succeeded".equals(result.status())) {
            return handleSucceeded(result, task, execution, current, now);
        }
        return handleFailed(result, task, execution, current, now);
    }

    private TaskResultAcknowledgement handleRunning(
            TaskResult result,
            GenerationTaskEntity task,
            GenerationTaskExecutionEntity execution,
            GenerationTaskStatus current,
            Instant now) {
        if (current == GenerationTaskStatus.QUEUED && "queued".equals(execution.status())) {
            stateMachine.transition(current, GenerationTaskStatus.RUNNING);
        } else if (current == GenerationTaskStatus.RUNNING && "running".equals(execution.status())) {
            if (result.progress() <= task.progress()) {
                return ignored(result);
            }
        } else {
            return ignored(result);
        }

        task.markRunning(result.progress(), now);
        execution.markRunning(now);
        taskRepository.save(task);
        executionRepository.save(execution);
        eventPublisher.publishEvent(new TaskRunningEvent(
                this, task.id(), task.taskType(), task.episodeId(), task.attempt(), task.progress(), now));
        return accepted(result);
    }

    private TaskResultAcknowledgement handleSucceeded(
            TaskResult result,
            GenerationTaskEntity task,
            GenerationTaskExecutionEntity execution,
            GenerationTaskStatus current,
            Instant now) {
        if (current != GenerationTaskStatus.RUNNING || !"running".equals(execution.status())) {
            return ignored(result);
        }
        stateMachine.transition(current, GenerationTaskStatus.SUCCEEDED);
        task.markSucceeded(result.result(), now);
        execution.markSucceeded(result.result(), now);
        taskRepository.save(task);
        executionRepository.save(execution);
        eventPublisher.publishEvent(new TaskSucceededEvent(
                this, task.id(), task.taskType(), task.episodeId(), task.attempt(), result.result(), now));
        return accepted(result);
    }

    private TaskResultAcknowledgement handleFailed(
            TaskResult result,
            GenerationTaskEntity task,
            GenerationTaskExecutionEntity execution,
            GenerationTaskStatus current,
            Instant now) {
        if (current != GenerationTaskStatus.RUNNING || !"running".equals(execution.status())) {
            return ignored(result);
        }
        stateMachine.transition(current, GenerationTaskStatus.FAILED);
        task.markFailed(result.error().retryable(), result.error().code(), result.error().message(), now);
        execution.markFailed(result.error().code(), result.error().message(), now);
        taskRepository.save(task);
        executionRepository.save(execution);
        eventPublisher.publishEvent(new TaskFailedEvent(
                this,
                task.id(),
                task.taskType(),
                task.episodeId(),
                task.attempt(),
                new TaskErrorSnapshot(result.error().code(), result.error().message(), result.error().retryable()),
                now));
        return accepted(result);
    }

    private boolean hasIdentity(TaskResult result) {
        return result != null
                && result.messageId() != null
                && result.taskId() != null
                && result.episodeId() != null
                && result.attempt() != null
                && result.status() != null;
    }

    private boolean hasValidPayload(TaskResult result) {
        if (result.progress() == null || result.progress() < 0 || result.progress() > 100) {
            return false;
        }
        if ("running".equals(result.status())) {
            return result.result() == null && result.error() == null;
        }
        if ("succeeded".equals(result.status())) {
            return result.progress() == 100 && result.result() != null && result.error() == null;
        }
        if ("failed".equals(result.status())) {
            return result.progress() == 100
                    && result.result() == null
                    && result.error() != null
                    && result.error().code() != null
                    && !result.error().code().isBlank()
                    && result.error().message() != null
                    && !result.error().message().isBlank()
                    && result.error().retryable() != null;
        }
        return false;
    }

    private GenerationTaskStatus statusOf(String wireValue) {
        for (GenerationTaskStatus status : GenerationTaskStatus.values()) {
            if (status.wireValue().equals(wireValue)) {
                return status;
            }
        }
        throw new IllegalStateException("unknown task status: " + wireValue);
    }

    private TaskResultAcknowledgement accepted(TaskResult result) {
        return new TaskResultAcknowledgement(result.taskId(), false);
    }

    private TaskResultAcknowledgement ignored(TaskResult result) {
        return new TaskResultAcknowledgement(result == null ? null : result.taskId(), true);
    }
}
