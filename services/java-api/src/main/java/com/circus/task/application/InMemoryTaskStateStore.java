package com.circus.task.application;

import com.circus.task.api.dto.CreateTaskCommand;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
/** 无真实仓储适配器时的空跑实现；仅用于 G1 和应用可启动，绝不能作为生产任务状态来源。 */
class InMemoryTaskStateStore implements TaskStateStore {

    private final Map<String, UUID> idempotency = new ConcurrentHashMap<>();

    @Override
    public Optional<UUID> findByIdempotencyKeyAndTaskType(String idempotencyKey, String taskType) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(idempotency.get(idempotencyKey + ":" + taskType));
    }

    @Override
    public TaskDispatch createPending(CreateTaskCommand command) {
        UUID taskId = UUID.randomUUID();
        if (command.idempotencyKey() != null && !command.idempotencyKey().isBlank()) {
            idempotency.putIfAbsent(command.idempotencyKey() + ":" + command.taskType(), taskId);
        }
        // 真实适配器应在同一事务把这个 ID 写入 generation_task_execution.message_id。
        return new TaskDispatch(UUID.randomUUID(), taskId, command, 0, UUID.randomUUID().toString(), Instant.now());
    }

    @Override
    public void retry(UUID taskId) {}

    @Override
    public void cancel(UUID taskId) {}
}
