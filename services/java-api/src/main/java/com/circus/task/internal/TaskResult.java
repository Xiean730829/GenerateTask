package com.circus.task.internal;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

/** 对齐 task-result.schema.json 的 Worker 回写 DTO，由 Python HTTP 客户端序列化。 */
public record TaskResult(@NotNull UUID messageId, @NotNull UUID taskId, @NotNull UUID episodeId,
                         // @NotBlank/@NotNull/@Min/@Max：在控制器入口拦截无效 worker 回写。
                         @NotBlank String status, @NotNull @Min(0) Integer attempt,
                         @NotNull @Min(0) @Max(100) Integer progress, JsonNode result,
                         @Valid TaskResultError error, @Valid TaskWorker worker, @NotNull Instant reportedAt) {}
