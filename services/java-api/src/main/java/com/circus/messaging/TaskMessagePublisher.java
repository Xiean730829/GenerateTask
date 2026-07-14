package com.circus.messaging;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

/** task 模块唯一可见的消息发布实现；RabbitTemplate 不向业务入口泄漏。 */
// @Component：让 Spring 自动注入该发布器给 AFTER_COMMIT 监听器。
@Component
// @ConditionalOnBean：没有配置 RabbitTemplate 的轻量测试上下文不创建该 Bean。
@ConditionalOnBean(RabbitTemplate.class)
public class TaskMessagePublisher {

    private final RabbitTemplate rabbitTemplate;
    private final Jackson2JsonMessageConverter messageConverter;
    private final PublishConfirmHandler confirmHandler;

    public TaskMessagePublisher(RabbitTemplate rabbitTemplate, Jackson2JsonMessageConverter messageConverter,
                                PublishConfirmHandler confirmHandler) {
        this.rabbitTemplate = rabbitTemplate;
        this.messageConverter = messageConverter;
        this.confirmHandler = confirmHandler;
    }

    /** 在应用启动时安装确认与退回回调。 */
    // @PostConstruct：依赖注入完成后只执行一次，确保每次发布都能收到 broker 结果。
    @PostConstruct
    void configureTemplateCallbacks() {
        rabbitTemplate.setMessageConverter(messageConverter);
        rabbitTemplate.setConfirmCallback(confirmHandler);
        rabbitTemplate.setReturnsCallback(confirmHandler);
    }

    /**
     * 发布一条不可变执行快照。
     *
     * <p>当前骨架在此生成 messageId；接入 V5 执行记录后，应由 task 模块先创建并持久化该 ID，
     * 再把同一个 ID 放进消息，才能按 messageId 安全回写。</p>
     */
    public void publish(TaskExecutionMessage taskExecution) {
        Objects.requireNonNull(taskExecution, "taskExecution");
        UUID messageId = UUID.randomUUID();
        TaskExecutionMessage message = taskExecution.withMessageId(messageId);
        TaskPublication publication = new TaskPublication(messageId, message.taskId(), message.attempt());
        MessagePostProcessor identityHeaders = outbound -> {
            outbound.getMessageProperties().setMessageId(messageId.toString());
            outbound.getMessageProperties().setCorrelationId(publication.correlationId());
            return outbound;
        };
        rabbitTemplate.convertAndSend(RabbitTopologyConfig.TASK_EXCHANGE,
                RabbitTopologyConfig.TASK_EXECUTE_ROUTING_KEY,
                message.withMessageId(messageId), identityHeaders, confirmHandler.track(publication));
    }
}
