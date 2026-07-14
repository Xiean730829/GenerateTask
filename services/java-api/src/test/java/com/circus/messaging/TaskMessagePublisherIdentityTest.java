package com.circus.messaging;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.ObjectProvider;

/** 锁定发布器必须使用 V5 execution 预先分配的 messageId，而不是重新生成身份。 */
class TaskMessagePublisherIdentityTest {

    /** @Test：验证发布消息和确认关联都复用 execution 预先分配的身份。 */
    @Test
    void publisherPreservesExecutionMessageIdAndTaskAttemptCorrelation() {
        UUID messageId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        TaskExecutionMessage execution = new TaskExecutionMessage(messageId, taskId, "script.generate",
                UUID.randomUUID(), UUID.randomUUID(), null, null, 2, "trace", Instant.now(),
                JsonNodeFactory.instance.objectNode().put("sourceText", "test"));
        RecordingRabbitTemplate rabbitTemplate = new RecordingRabbitTemplate();
        PublishConfirmHandler confirmHandler = new PublishConfirmHandler(new PublishOutcomeListener() {
            @Override
            public void onPublished(TaskPublication publication) {}

            @Override
            public void onPublishFailed(TaskPublication publication, String errorCode, String reason) {}
        });

        new TaskMessagePublisher(new SingleObjectProvider<>(rabbitTemplate),
                new Jackson2JsonMessageConverter(), confirmHandler)
                .publish(execution);

        assertEquals(messageId, ((TaskExecutionMessage) rabbitTemplate.body).messageId());
        assertNotNull(rabbitTemplate.correlationData);
        assertEquals(taskId + ":2", rabbitTemplate.correlationData.getId());
    }

    private static final class RecordingRabbitTemplate extends RabbitTemplate {
        private Object body;
        private CorrelationData correlationData;

        @Override
        public void convertAndSend(String exchange, String routingKey, Object message,
                                   MessagePostProcessor processor, CorrelationData correlationData) {
            this.body = message;
            this.correlationData = correlationData;
        }
    }

    private static final class SingleObjectProvider<T> implements ObjectProvider<T> {
        private final T object;

        private SingleObjectProvider(T object) {
            this.object = object;
        }

        @Override
        public T getObject(Object... args) {
            return object;
        }

        @Override
        public T getIfAvailable() {
            return object;
        }

        @Override
        public T getIfUnique() {
            return object;
        }

        @Override
        public java.util.Iterator<T> iterator() {
            return java.util.Collections.singleton(object).iterator();
        }
    }
}
