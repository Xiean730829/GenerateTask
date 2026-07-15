package com.circus.task.application;

import com.circus.messaging.PublishOutcomeListener;
import com.circus.messaging.TaskPublication;
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
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists broker outcomes without exposing RabbitTemplate to the task domain.
 * The publication identity is checked against the immutable execution row before
 * the current task row is changed.
 */
@Service
@ConditionalOnBean({GenerationTaskRepository.class, GenerationTaskExecutionRepository.class})
public class TaskPublishOutcomeListener implements PublishOutcomeListener {

    private final GenerationTaskRepository taskRepository;
    private final GenerationTaskExecutionRepository executionRepository;
    private final Clock clock;
    private final GenerationTaskStateMachine stateMachine;

    @Autowired
    public TaskPublishOutcomeListener(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository) {
        this(taskRepository, executionRepository, Clock.systemUTC(), new GenerationTaskStateMachine());
    }

    TaskPublishOutcomeListener(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            Clock clock) {
        this(taskRepository, executionRepository, clock, new GenerationTaskStateMachine());
    }

    TaskPublishOutcomeListener(
            GenerationTaskRepository taskRepository,
            GenerationTaskExecutionRepository executionRepository,
            Clock clock,
            GenerationTaskStateMachine stateMachine) {
        this.taskRepository = taskRepository;
        this.executionRepository = executionRepository;
        this.clock = clock;
        this.stateMachine = stateMachine;
    }

    @Override
    @Transactional
    public void onPublished(TaskPublication publication) {
        PublicationContext context = findContext(publication);
        if (context == null) {
            return;
        }
        if (!"queued".equals(context.execution().status())) {
            return;
        }
        GenerationTaskStatus current = statusOf(context.task().status());
        if (current != GenerationTaskStatus.PENDING && current != GenerationTaskStatus.RETRYING) {
            return;
        }
        stateMachine.transition(current, GenerationTaskStatus.QUEUED);
        Instant now = clock.instant();
        context.task().markQueued(now);
        context.execution().markPublished(now);
        taskRepository.save(context.task());
        executionRepository.save(context.execution());
    }

    @Override
    @Transactional
    public void onPublishFailed(TaskPublication publication, String errorCode, String reason) {
        PublicationContext context = findContext(publication);
        if (context == null) {
            return;
        }
        if (!"queued".equals(context.execution().status())) {
            return;
        }
        GenerationTaskStatus current = statusOf(context.task().status());
        if (current != GenerationTaskStatus.PENDING && current != GenerationTaskStatus.RETRYING) {
            return;
        }
        if (current == GenerationTaskStatus.RETRYING) {
            stateMachine.transition(current, GenerationTaskStatus.FAILED);
        }
        Instant now = clock.instant();
        context.task().markPublishFailed(errorCode, reason, now);
        context.execution().markFailed(errorCode, reason, now);
        taskRepository.save(context.task());
        executionRepository.save(context.execution());
    }

    private PublicationContext findContext(TaskPublication publication) {
        if (publication == null
                || publication.messageId() == null
                || publication.taskId() == null
                || publication.attempt() == null) {
            return null;
        }
        Optional<GenerationTaskExecutionEntity> execution = executionRepository.findById(publication.messageId());
        if (execution.isEmpty()) {
            return null;
        }
        GenerationTaskExecutionEntity executionEntity = execution.get();
        if (!publication.taskId().equals(executionEntity.taskId())
                || !publication.attempt().equals(executionEntity.attempt())) {
            return null;
        }
        Optional<GenerationTaskEntity> task = taskRepository.findById(publication.taskId());
        return task.map(taskEntity -> new PublicationContext(taskEntity, executionEntity)).orElse(null);
    }

    private GenerationTaskStatus statusOf(String wireValue) {
        for (GenerationTaskStatus status : GenerationTaskStatus.values()) {
            if (status.wireValue().equals(wireValue)) {
                return status;
            }
        }
        throw new IllegalStateException("unknown task status: " + wireValue);
    }

    private record PublicationContext(
            GenerationTaskEntity task,
            GenerationTaskExecutionEntity execution) {}
}
