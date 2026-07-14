package com.circus.task.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** 失败回写的稳定错误信息与是否可重试标记；@NotBlank/@NotNull 防止错误结构残缺。 */
public record TaskResultError(@NotBlank String code, @NotBlank String message, @NotNull Boolean retryable) {}
