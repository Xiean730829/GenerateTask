package com.circus.orchestration.application;

import com.circus.orchestration.api.NextStep;
import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.event.TaskSucceededEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** 只监听已提交的成功事件；不直接感知 HTTP 回写控制器。 */
// @Component：注册为生命周期事件消费者。
@Component
public class TaskResultDispatcher {

    private final TaskResultHandlerRegistry handlerRegistry;
    private final PipelinePolicy pipelinePolicy;
    private final TaskCommandInterface taskCommands;

    public TaskResultDispatcher(TaskResultHandlerRegistry handlerRegistry, PipelinePolicy pipelinePolicy,
                                TaskCommandInterface taskCommands) {
        this.handlerRegistry = handlerRegistry;
        this.pipelinePolicy = pipelinePolicy;
        this.taskCommands = taskCommands;
    }

    // @TransactionalEventListener(AFTER_COMMIT)：只消费已经落库的成功状态，编排不读取未提交数据。
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskSucceeded(TaskSucceededEvent event) {
        // Handler 始终先保存业务结果；PipelinePolicy 只控制是否执行返回的下一步。
        handlerRegistry.find(event.taskType())
                .flatMap(handler -> handler.handle(event))
                .filter(nextStep -> pipelinePolicy.automaticallyChains(event.taskType()))
                .ifPresent(this::dispatch);
    }

    /** 将 handler 的声明式意图转换为实际调用；业务 handler 不直接发送 MQ。 */
    private void dispatch(NextStep nextStep) {
        if (nextStep instanceof NextStep.Async async) {
            taskCommands.create(async.command());
        } else if (nextStep instanceof NextStep.Sync sync) {
            sync.runnable().run();
        }
    }
}
