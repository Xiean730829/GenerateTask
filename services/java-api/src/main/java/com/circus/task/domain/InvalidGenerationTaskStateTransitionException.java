package com.circus.task.domain;

public class InvalidGenerationTaskStateTransitionException extends RuntimeException {

    public InvalidGenerationTaskStateTransitionException(
            GenerationTaskStatus currentStatus,
            GenerationTaskStatus nextStatus) {
        super("Unsupported generation task status transition: %s -> %s".formatted(
                currentStatus.wireValue(),
                nextStatus.wireValue()));
    }
}
