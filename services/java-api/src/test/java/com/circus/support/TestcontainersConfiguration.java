package com.circus.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * 测试用基础设施：用 Testcontainers 启动与 compose 栈相同版本的
 * PostgreSQL / Redis / RabbitMQ 容器，并通过 {@link ServiceConnection}
 * 自动注入连接参数，无需手工配置 URL/端口。
 *
 * <p>镜像版本与 infra/compose/local/docker-compose.yaml 保持一致，
 * 保证测试环境与本地开发环境的连通行为一致。
 *
 * <p>注意：运行相关测试需要本机可用的 Docker 守护进程。
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
                .withDatabaseName("auto_drama")
                .withUsername("auto_drama")
                .withPassword("auto_drama_dev");
    }

    @Bean
    @ServiceConnection
    RabbitMQContainer rabbitContainer() {
        return new RabbitMQContainer(DockerImageName.parse("rabbitmq:3.13-management-alpine"));
    }

    // Redis 无专用 Testcontainers 模块，用 GenericContainer + name="redis" 让 Spring Boot 识别
    @Bean
    @ServiceConnection(name = "redis")
    GenericContainer<?> redisContainer() {
        return new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
                .withExposedPorts(6379);
    }
}
