package com.circus.task.internal;

import jakarta.validation.constraints.NotBlank;

/** 回写 Worker 的可追踪身份；@NotBlank 保证排障日志可定位具体 worker 版本。 */
public record TaskWorker(@NotBlank String name, @NotBlank String version) {}
