package com.circus.task.application;

import com.circus.task.api.TaskCommandInterface;
import com.circus.task.api.dto.CreateTaskCommand;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** TaskCommandInterface 的事务入口；真实状态机和仓储通过 TaskStateStore 注入。 */
// @Service：将命令入口注册为 Spring 业务服务，供所有内容模块注入。
@Service
public class TaskCommandService implements TaskCommandInterface {

    private final TaskStateStore taskStateStore;
    private final ApplicationEventPublisher eventPublisher;

    public TaskCommandService(TaskStateStore taskStateStore, ApplicationEventPublisher eventPublisher) {
        this.taskStateStore = taskStateStore;
        this.eventPublisher = eventPublisher;
    }

    /** @Override：实现业务模块依赖的稳定 TaskCommandInterface。 */
    @Override
    // @Transactional：任务行/执行记录先提交，AFTER_COMMIT 才允许向 Python 派发。
    @Transactional
    public UUID create(CreateTaskCommand command) {
        return taskStateStore.findByIdempotencyKeyAndTaskType(command.idempotencyKey(), command.taskType())
                .orElseGet(() -> {
                    TaskDispatch dispatch = taskStateStore.createPending(command);
                    eventPublisher.publishEvent(new TaskDispatchRequestedEvent(this, dispatch));
                    return dispatch.taskId();
                });
    }

    /** @Override：重试的实际状态机规则由 TaskStateStore 适配器实现。 */
    @Override
    // @Transactional：重试 attempt 的创建与状态变化必须同一事务提交。
    @Transactional
    public void retry(UUID taskId) {
        taskStateStore.retry(taskId);
    }

    /** @Override：取消规则同样留给真实状态机，避免命令层感知持久化细节。 */
    @Override
    // @Transactional：取消与后续状态校验保持原子性。
    @Transactional
    public void cancel(UUID taskId) {
        taskStateStore.cancel(taskId);
    }
}
