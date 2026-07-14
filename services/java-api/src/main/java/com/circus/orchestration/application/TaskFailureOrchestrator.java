package com.circus.orchestration.application;

import com.circus.task.api.event.TaskFailedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** 失败事件只更新阶段/标记，不发起自动重试。 */
// @Component：注册为失败生命周期事件消费者。
@Component
public class TaskFailureOrchestrator {

    private final TaskStageUpdater taskStageUpdater;

    public TaskFailureOrchestrator(TaskStageUpdater taskStageUpdater) {
        this.taskStageUpdater = taskStageUpdater;
    }

    // @TransactionalEventListener(AFTER_COMMIT)：只在失败状态持久化后更新上层 stage。
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskFailed(TaskFailedEvent event) {
        taskStageUpdater.markFailed(event);
    }
}
