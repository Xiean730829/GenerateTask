package com.circus.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.circus.bootstrap.AutoDramaStudioApplication;
import com.circus.support.TestcontainersConfiguration;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.DockerClientFactory;

/**
 * 基础设施连通性集成测试。
 *
 * <p>导入 {@link TestcontainersConfiguration}，用与 compose 栈相同版本的
 * PostgreSQL / Redis / RabbitMQ 容器验证连通性：应用启动时 Flyway 对 PostgreSQL
 * 执行迁移，健康检查整体为 UP 即说明 Java 侧已桥接三项基础设施。
 *
 * <p>Docker 不可用（或本机 Docker 环境异常）时，本测试会被<strong>跳过</strong>而非失败，
 * 以免普通构建被基础设施依赖阻断。需要真实验证时，请在可用 Docker 环境下运行。
 */
@SpringBootTest(classes = AutoDramaStudioApplication.class)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class InfrastructureHealthTest {

    /**
     * 前置校验：仅在本机 Docker 可用时运行。
     * 用 try/catch 兜底，避免 Docker 环境变量异常时抛出异常导致整个构建报错。
     */
    @BeforeAll
    static void requireDocker() {
        boolean dockerAvailable;
        try {
            dockerAvailable = DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable t) {
            dockerAvailable = false;
        }
        Assumptions.assumeTrue(dockerAvailable, "跳过：本机 Docker 不可用，基础设施连通性测试需要 Docker。");
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthReportsUpForAllInfrastructure() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components.db.status").value("UP"))
                .andExpect(jsonPath("$.components.redis.status").value("UP"))
                .andExpect(jsonPath("$.components.rabbit.status").value("UP"));
    }
}
