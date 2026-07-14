package com.circus.messaging;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.Objects;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/** task 模块唯一可见的消息发布实现；RabbitTemplate 不向业务入口泄漏。 */
// @Component：让 Spring 自动注入该发布器给 AFTER_COMMIT 监听器。
@Component
public class TaskMessagePublisher {

    private final ObjectProvider<RabbitTemplate> rabbitTemplateProvider;
    private final Jackson2JsonMessageConverter messageConverter;
    private final PublishConfirmHandler confirmHandler;

    public TaskMessagePublisher(ObjectProvider<RabbitTemplate> rabbitTemplateProvider,
                                Jackson2JsonMessageConverter messageConverter,
                                PublishConfirmHandler confirmHandler) {
        this.rabbitTemplateProvider = rabbitTemplateProvider;
        this.messageConverter = messageConverter;
        this.confirmHandler = confirmHandler;
    }

    /** 在应用启动时安装确认与退回回调。 */
    // @PostConstruct：依赖注入完成后只执行一次，确保每次发布都能收到 broker 结果。
    @PostConstruct
    void configureTemplateCallbacks() {
        RabbitTemplate rabbitTemplate = rabbitTemplateProvider.getIfAvailable();
        if (rabbitTemplate == null) {
            // 允许不启用 Rabbit 的健康检查上下文启动；真正发布时会给出明确错误。
            return;
        }
        rabbitTemplate.setMessageConverter(messageConverter);
        rabbitTemplate.setConfirmCallback(confirmHandler);
        rabbitTemplate.setReturnsCallback(confirmHandler);
    }

    /**
     * 发布一条不可变执行快照。
     *
     * <p>messageId 来自已创建的 V5 execution；本类只发布该身份，不能重新生成。</p>
     */
    public void publish(TaskExecutionMessage taskExecution) {
        Objects.requireNonNull(taskExecution, "taskExecution");
        Objects.requireNonNull(taskExecution.messageId(), "taskExecution.messageId");
        RabbitTemplate rabbitTemplate = rabbitTemplateProvider.getIfAvailable();
        if (rabbitTemplate == null) {
            throw new IllegalStateException("RabbitTemplate is required to publish task execution");
        }
        TaskExecutionMessage message = taskExecution;
        var messageId = message.messageId();
        TaskPublication publication = new TaskPublication(messageId, message.taskId(), message.attempt());
        MessagePostProcessor identityHeaders = outbound -> {
            outbound.getMessageProperties().setMessageId(messageId.toString());
            outbound.getMessageProperties().setCorrelationId(publication.correlationId());
            return outbound;
        };
        rabbitTemplate.convertAndSend(RabbitTopologyConfig.TASK_EXCHANGE,
                RabbitTopologyConfig.TASK_EXECUTE_ROUTING_KEY,
                message, identityHeaders, confirmHandler.track(publication));
    }
}
