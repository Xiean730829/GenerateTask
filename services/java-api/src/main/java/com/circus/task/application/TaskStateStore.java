package com.circus.task.application;

import com.circus.task.api.dto.CreateTaskCommand;
import java.util.Optional;
import java.util.UUID;

/**
 * task 状态机与仓储的替换 seam，由齐广志的真实持久化适配器实现。
 * 实现位置应在 task/application 或 task/infrastructure；替换 Bean 后 InMemoryTaskStateStore 自动失效。
 */
public interface TaskStateStore {

    Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType);

    TaskDispatch createPending(CreateTaskCommand command);

    void retry(UUID taskId);

    void cancel(UUID taskId);
}
