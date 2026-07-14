package com.circus.task.api;

import com.circus.task.api.dto.CreateTaskCommand;
import java.util.UUID;

/**
 * 业务模块发起、重试和取消任务的唯一入口，不暴露 MQ 细节。
 * Script、Shot、Panel 等业务服务只注入本接口，不得注入 RabbitTemplate 或 TaskMessagePublisher。
 */
public interface TaskCommandInterface {

    UUID create(CreateTaskCommand command);

    void retry(UUID taskId);

    void cancel(UUID taskId);
}
