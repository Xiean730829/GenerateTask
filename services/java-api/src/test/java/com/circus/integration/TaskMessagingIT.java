package com.circus.integration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.circus.messaging.PublishOutcomeListener;
import com.circus.messaging.TaskExecutionMessage;
import com.circus.messaging.TaskPublication;
import com.circus.messaging.TaskMessagePublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

/** RabbitMQ 实例级验收：验证 Java 声明的拓扑可被真实 broker 接收。 */
// @SpringBootTest：启动真实 Spring 上下文，并连接本地 Compose 已发布的 RabbitMQ。
@SpringBootTest(properties = {
        "spring.flyway.enabled=false",
        "spring.rabbitmq.host=localhost",
        "spring.rabbitmq.port=5672",
        "spring.rabbitmq.username=auto_drama",
        "spring.rabbitmq.password=auto_drama_dev",
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration"
})
// @ActiveProfiles：使用集成测试配置，明确这是本地 Compose broker 验收。
@ActiveProfiles("integration")
// @ContextConfiguration：注入测试专用确认监听器，观察 ack 而不写真实任务表。
@ContextConfiguration(classes = TaskMessagingIT.OutcomeConfiguration.class)
class TaskMessagingIT {

    @Autowired
    private TaskMessagePublisher taskMessagePublisher;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private CapturingPublishOutcomeListener outcomeListener;

    @Autowired
    private ObjectMapper objectMapper;

    /** @Test：验证 broker ack 被收到，且消息最终进入 Python 应消费的 drama.task.execute 队列。 */
    @Test
    void publisherConfirmAndQueueDeliveryWorkAgainstRabbitMq() throws InterruptedException {
        UUID taskId = UUID.randomUUID();
        taskMessagePublisher.publish(new TaskExecutionMessage(UUID.randomUUID(), taskId, "script.generate", UUID.randomUUID(),
                UUID.randomUUID(), null, null, 0, "integration-trace", Instant.now(),
                objectMapper.createObjectNode().put("sourceText", "test").set("projectConfig", objectMapper.createObjectNode())));

        assertTrue(outcomeListener.confirmed.await(10, TimeUnit.SECONDS), "publisher confirm must be received");
        Message message = rabbitTemplate.receive("drama.task.execute", TimeUnit.SECONDS.toMillis(10));
        assertNotNull(message, "Python-consumed queue must receive the execution message");
    }

    /** 捕获发布确认，等价于 task 模块未来将 queued 状态回填到执行记录的 seam。 */
    // @TestConfiguration：仅测试上下文加载此 Bean，生产环境不会使用。
    @TestConfiguration
    // @EnableAutoConfiguration：启用 RabbitMQ/Spring Boot 自动配置以接近真实运行环境。
    @EnableAutoConfiguration
    static class OutcomeConfiguration {

        /** @Bean：注册测试确认监听器。 */
        @Bean
        // @Primary：覆盖生产的 no-op fallback，保证可观测到发布确认。
        @Primary
        CapturingPublishOutcomeListener capturingPublishOutcomeListener() {
            return new CapturingPublishOutcomeListener();
        }
    }

    static class CapturingPublishOutcomeListener implements PublishOutcomeListener {
        private final CountDownLatch confirmed = new CountDownLatch(1);

        @Override
        public void onPublished(TaskPublication publication) {
            confirmed.countDown();
        }

        @Override
        public void onPublishFailed(TaskPublication publication, String errorCode, String reason) {
            throw new AssertionError("unexpected publish failure: " + errorCode + ": " + reason);
        }
    }
}
