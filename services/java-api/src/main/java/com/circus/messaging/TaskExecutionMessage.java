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

    /** 返回带派发身份的新快照；record 本身不被原地修改。 */
    public TaskExecutionMessage withMessageId(UUID generatedMessageId) {
        return new TaskExecutionMessage(generatedMessageId, taskId, taskType, projectId, episodeId, shotId,
                panelId, attempt, traceId, createdAt, payload);
    }
}
