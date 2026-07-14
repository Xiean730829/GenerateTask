package com.circus.messaging;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

/** 统一处理 publisher confirm 和 mandatory return，防止业务模块依赖 RabbitTemplate。 */
public class PublishConfirmHandler implements RabbitTemplate.ConfirmCallback, RabbitTemplate.ReturnsCallback {

    public static final String PUBLISH_CONFIRM_FAILED = "TASK_PUBLISH_CONFIRM_FAILED";

    private final PublishOutcomeListener outcomeListener;
    private final ConcurrentMap<String, TaskPublication> pendingPublications = new ConcurrentHashMap<>();

    public PublishConfirmHandler(PublishOutcomeListener outcomeListener) {
        this.outcomeListener = outcomeListener;
    }

    /** 发布前登记关联信息，使确认回调可定位 taskId 与 attempt。 */
    public CorrelationData track(TaskPublication publication) {
        pendingPublications.put(publication.correlationId(), publication);
        return new CorrelationData(publication.correlationId());
    }

    /** @Override：RabbitTemplate 在 broker 确认或拒绝消息时调用本方法。 */
    @Override
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {
        if (correlationData == null) {
            return;
        }
        TaskPublication publication = pendingPublications.remove(correlationData.getId());
        if (publication == null) {
            return;
        }
        if (ack) {
            outcomeListener.onPublished(publication);
        } else {
            outcomeListener.onPublishFailed(publication, PUBLISH_CONFIRM_FAILED, cause);
        }
    }

    /** @Override：mandatory=true 且消息无法路由时调用本方法。 */
    @Override
    public void returnedMessage(ReturnedMessage returned) {
        String correlationId = returned.getMessage().getMessageProperties().getCorrelationId();
        TaskPublication publication = pendingPublications.remove(correlationId);
        if (publication != null) {
            outcomeListener.onPublishFailed(publication, PUBLISH_CONFIRM_FAILED, returned.toString());
        }
    }
}
