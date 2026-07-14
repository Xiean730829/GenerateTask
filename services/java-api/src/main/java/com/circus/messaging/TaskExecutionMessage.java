package com.circus.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

/**
 * Java 发给 Python Worker 的不可变执行消息。
 * Python 消费 drama.task.execute 时按此 JSON 读取，再用 messageId、taskId、attempt 回写 Java。
 */
public record TaskExecutionMessage(
        UUID messageId,
        UUID taskId,
        String taskType,
        UUID projectId,
        UUID episodeId,
        UUID shotId,
        UUID panelId,
        Integer attempt,
        String traceId,
        Instant createdAt,
        JsonNode payload) {

}
