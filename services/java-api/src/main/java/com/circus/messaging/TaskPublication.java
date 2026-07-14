package com.circus.messaging;

import java.util.UUID;

/** 发布确认关联信息；CorrelationData 使用 taskId + attempt，以便确认回调关联本次派发。 */
public record TaskPublication(UUID messageId, UUID taskId, Integer attempt) {

    String correlationId() {
        return taskId + ":" + attempt;
    }
}
