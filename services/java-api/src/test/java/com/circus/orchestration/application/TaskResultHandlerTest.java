package com.circus.orchestration.application;

import static org.junit.jupiter.api.Assertions.assertSame;

import com.circus.orchestration.api.ScriptResultStore;
import com.circus.orchestration.api.ShotResultStore;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.dto.CreateTaskCommand;
import com.circus.task.api.event.TaskSucceededEvent;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

/** 锁定 Script/Shot 成功结果先保存，PipelinePolicy 只控制是否继续串联。 */
class TaskResultHandlerTest {

    /** @Test：script.generate 即使不自动串联，也必须先交给 ScriptResultStore 保存。 */
    @Test
    void scriptHandlerStoresResultEvenWhenAutomaticChainingIsDisabled() {
        TaskSucceededEvent event = succeeded("script.generate");
        AtomicReference<TaskSucceededEvent> saved = new AtomicReference<>();
        ScriptResultStore store = saved::set;
        TaskResultDispatcher dispatcher = dispatcher(new ScriptGenerationResultHandler(store));

        dispatcher.onTaskSucceeded(event);

        assertSame(event, saved.get());
    }

    /** @Test：shot.generate 即使不自动串联，也必须先交给 ShotResultStore 保存。 */
    @Test
    void shotHandlerStoresResultEvenWhenAutomaticChainingIsDisabled() {
        TaskSucceededEvent event = succeeded("shot.generate");
        AtomicReference<TaskSucceededEvent> saved = new AtomicReference<>();
        ShotResultStore store = saved::set;
        TaskResultDispatcher dispatcher = dispatcher(new ShotGenerationResultHandler(store));

        dispatcher.onTaskSucceeded(event);

        assertSame(event, saved.get());
    }

    private static TaskResultDispatcher dispatcher(com.circus.orchestration.api.TaskResultHandler handler) {
        TaskCommandInterface noFollowUp = new TaskCommandInterface() {
            @Override
            public UUID create(CreateTaskCommand command) {
                throw new AssertionError("manual pipeline must not create a follow-up task");
            }

            @Override
            public void retry(UUID taskId) {}

            @Override
            public void cancel(UUID taskId) {}
        };
        return new TaskResultDispatcher(new TaskResultHandlerRegistry(List.of(handler)), new PipelinePolicy(), noFollowUp);
    }

    private static TaskSucceededEvent succeeded(String taskType) {
        return new TaskSucceededEvent(new Object(), UUID.randomUUID(), taskType, UUID.randomUUID(), 0,
                JsonNodeFactory.instance.objectNode().put("accepted", true), Instant.now());
    }
}
