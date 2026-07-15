package com.circus.task.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class GenerationTaskStateMachineTest {

    private final GenerationTaskStateMachine machine = new GenerationTaskStateMachine();

    @Test
    void followsThePublishedHappyPath() {
        assertThat(machine.transition(GenerationTaskStatus.PENDING, GenerationTaskStatus.QUEUED))
                .isEqualTo(GenerationTaskStatus.QUEUED);
        assertThat(machine.transition(GenerationTaskStatus.QUEUED, GenerationTaskStatus.RUNNING))
                .isEqualTo(GenerationTaskStatus.RUNNING);
        assertThat(machine.transition(GenerationTaskStatus.RUNNING, GenerationTaskStatus.SUCCEEDED))
                .isEqualTo(GenerationTaskStatus.SUCCEEDED);
    }

    @Test
    void allowsWorkerFailureAndRetryRepublishFailure() {
        assertThat(machine.transition(GenerationTaskStatus.RUNNING, GenerationTaskStatus.FAILED))
                .isEqualTo(GenerationTaskStatus.FAILED);
        assertThat(machine.transition(GenerationTaskStatus.FAILED, GenerationTaskStatus.RETRYING))
                .isEqualTo(GenerationTaskStatus.RETRYING);
        assertThat(machine.transition(GenerationTaskStatus.RETRYING, GenerationTaskStatus.QUEUED))
                .isEqualTo(GenerationTaskStatus.QUEUED);
        assertThat(machine.transition(GenerationTaskStatus.RETRYING, GenerationTaskStatus.FAILED))
                .isEqualTo(GenerationTaskStatus.FAILED);
    }

    @Test
    void allowsCancellationBeforeExecutionOrAfterFailure() {
        assertThat(machine.transition(GenerationTaskStatus.PENDING, GenerationTaskStatus.CANCELED))
                .isEqualTo(GenerationTaskStatus.CANCELED);
        assertThat(machine.transition(GenerationTaskStatus.QUEUED, GenerationTaskStatus.CANCELED))
                .isEqualTo(GenerationTaskStatus.CANCELED);
        assertThat(machine.transition(GenerationTaskStatus.FAILED, GenerationTaskStatus.CANCELED))
                .isEqualTo(GenerationTaskStatus.CANCELED);
    }

    @Test
    void rejectsReturningToAnEarlierOrTerminalState() {
        assertThatThrownBy(() -> machine.transition(
                GenerationTaskStatus.RUNNING, GenerationTaskStatus.QUEUED))
                .isInstanceOf(InvalidGenerationTaskStateTransitionException.class)
                .hasMessageContaining("running")
                .hasMessageContaining("queued");
        assertThatThrownBy(() -> machine.transition(
                GenerationTaskStatus.SUCCEEDED, GenerationTaskStatus.RUNNING))
                .isInstanceOf(InvalidGenerationTaskStateTransitionException.class)
                .hasMessageContaining("succeeded")
                .hasMessageContaining("running");
    }

    @Test
    void exposesTheLowercaseWireValuesUsedByTheDatabaseAndContracts() {
        assertThat(GenerationTaskStatus.PENDING.wireValue()).isEqualTo("pending");
        assertThat(GenerationTaskStatus.QUEUED.wireValue()).isEqualTo("queued");
        assertThat(GenerationTaskStatus.RUNNING.wireValue()).isEqualTo("running");
        assertThat(GenerationTaskStatus.SUCCEEDED.wireValue()).isEqualTo("succeeded");
        assertThat(GenerationTaskStatus.FAILED.wireValue()).isEqualTo("failed");
        assertThat(GenerationTaskStatus.RETRYING.wireValue()).isEqualTo("retrying");
        assertThat(GenerationTaskStatus.CANCELED.wireValue()).isEqualTo("canceled");
    }
}
