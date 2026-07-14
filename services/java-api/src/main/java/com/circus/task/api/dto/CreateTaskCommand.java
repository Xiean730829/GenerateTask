package com.circus.task.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * 创建任务所需的业务上下文和不可变 payload 快照。
 * 各内容负责人在自己的 service 中组装 payload，再调用 TaskCommandInterface#create。
 */
public record CreateTaskCommand(
        // @NotBlank：拒绝空任务类型，避免无法路由到 Worker/handler 的任务。
        @NotBlank String taskType,
        // @NotNull：每个异步任务必须能定位项目与剧集。
        @NotNull UUID projectId,
        @NotNull UUID episodeId,
        UUID shotId,
        UUID panelId,
        // @NotNull：派发给 Python 的输入快照不可缺失。
        @NotNull JsonNode payload,
        String idempotencyKey) {}
