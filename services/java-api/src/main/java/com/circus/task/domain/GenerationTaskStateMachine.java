package com.circus.task.domain;

public class GenerationTaskStateMachine {

    public GenerationTaskStatus transition(
            GenerationTaskStatus currentStatus,
            GenerationTaskStatus nextStatus) {
        if (currentStatus == GenerationTaskStatus.PENDING
                && nextStatus == GenerationTaskStatus.QUEUED) {
            return nextStatus;
        }
        if (currentStatus == GenerationTaskStatus.QUEUED
                && nextStatus == GenerationTaskStatus.RUNNING) {
            return nextStatus;
        }
        if (currentStatus == GenerationTaskStatus.RUNNING
                && (nextStatus == GenerationTaskStatus.SUCCEEDED
                || nextStatus == GenerationTaskStatus.FAILED)) {
            return nextStatus;
        }
        if (currentStatus == GenerationTaskStatus.FAILED
                && nextStatus == GenerationTaskStatus.RETRYING) {
            return nextStatus;
        }
        if (currentStatus == GenerationTaskStatus.RETRYING
                && (nextStatus == GenerationTaskStatus.QUEUED
                || nextStatus == GenerationTaskStatus.FAILED)) {
            return nextStatus;
        }
        if (nextStatus == GenerationTaskStatus.CANCELED
                && (currentStatus == GenerationTaskStatus.PENDING
                || currentStatus == GenerationTaskStatus.QUEUED
                || currentStatus == GenerationTaskStatus.FAILED)) {
            return nextStatus;
        }
        throw new InvalidGenerationTaskStateTransitionException(currentStatus, nextStatus);
    }
}
