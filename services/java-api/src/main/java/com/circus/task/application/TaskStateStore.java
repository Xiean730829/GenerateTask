package com.circus.task.application;

import com.circus.task.api.dto.CreateTaskCommand;
import java.util.Optional;
import java.util.UUID;

/**
 * task 状态机与仓储的替换 seam，由齐广志的真实持久化适配器实现。
 * 实现位置应在 task/application 或 task/infrastructure；替换 Bean 后 InMemoryTaskStateStore 自动失效。
 * createPending 必须在同一事务创建当前任务行和 generation_task_execution 行，并返回同一个 messageId。
 */
public interface TaskStateStore {

    Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType);

    TaskDispatch createPending(CreateTaskCommand command);

    TaskDispatch retry(UUID taskId);

    void cancel(UUID taskId);
}
