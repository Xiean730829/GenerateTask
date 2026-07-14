package com.circus.task.internal;

import java.util.UUID;

/** 回写处理结果；ignored=true 表示旧 attempt、重复回写或无效 messageId 被安全忽略。 */
public record TaskResultAcknowledgement(UUID taskId, boolean ignored) {}
