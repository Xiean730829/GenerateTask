package com.circus.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Local Compose infrastructure verification, deliberately run only by {@code -Pintegration verify}.
 *
 * <p>The test connects to the PostgreSQL, Redis and RabbitMQ instances published by
 * {@code infra/compose/local/docker-compose.yaml}. It must fail when that local infrastructure
 * is unavailable; it must never be silently skipped and reported as a successful Maven test run.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration")
class InfrastructureHealthIT {

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
