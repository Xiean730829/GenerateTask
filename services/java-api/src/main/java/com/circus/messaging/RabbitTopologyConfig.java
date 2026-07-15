package com.circus.messaging;

import java.util.Map;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 由 Spring AMQP 自动声明并与 asyncapi.yaml 一致的 RabbitMQ 拓扑。 */
// @Configuration：把本类交给 Spring，在应用启动时创建以下 Exchange、Queue、Binding Bean。
@Configuration
public class RabbitTopologyConfig {

    public static final String TASK_EXCHANGE = "drama.tasks";
    public static final String TASK_EXECUTE_QUEUE = "drama.task.execute";
    public static final String TASK_DLQ = "drama.task.dlq";
    public static final String TASK_EXECUTE_ROUTING_KEY = "task.execute";

    /** @Bean：声明名为 drama.tasks 的持久化 Topic Exchange。 */
    @Bean
    TopicExchange taskExchange() {
        return new TopicExchange(TASK_EXCHANGE, true, false);
    }

    /** @Bean：声明 Python Worker 消费的主队列；失败消息转入 DLQ。 */
    @Bean
    Queue taskExecuteQueue() {
        return new Queue(TASK_EXECUTE_QUEUE, true, false, false, Map.of(
                "x-dead-letter-exchange", "",
                "x-dead-letter-routing-key", TASK_DLQ));
    }

    /** @Bean：声明死信队列，便于人工排查无法处理的消息。 */
    @Bean
    Queue taskDeadLetterQueue() {
        return new Queue(TASK_DLQ, true);
    }

    /** @Bean：将 task.execute 路由键绑定到 Python 消费队列。 */
    @Bean
    Binding taskExecuteBinding(Queue taskExecuteQueue, TopicExchange taskExchange) {
        return BindingBuilder.bind(taskExecuteQueue).to(taskExchange).with(TASK_EXECUTE_ROUTING_KEY);
    }

    /** @Bean：指定 Rabbit 消息使用 JSON，供 Python 按 JSON 合同反序列化。 */
    @Bean
    Jackson2JsonMessageConverter jacksonTaskMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /** @Bean：把 broker 的 ack/nack/return 统一转换为 PublishOutcomeListener 回调。 */
    @Bean
    PublishConfirmHandler publishConfirmHandler(ObjectProvider<PublishOutcomeListener> listenerProvider) {
        PublishOutcomeListener outcomeListener = listenerProvider.getIfAvailable(() -> new PublishOutcomeListener() {
            @Override
            public void onPublished(TaskPublication publication) {}

            @Override
            public void onPublishFailed(TaskPublication publication, String errorCode, String reason) {}
        });
        return new PublishConfirmHandler(outcomeListener);
    }
}
