package com.circus.task.application;

import com.circus.task.api.TaskReadService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Provides the non-persistent read fallback only when the real read service is absent. */
@Configuration
class GenerationTaskReadConfiguration {

    @Bean
    @ConditionalOnMissingBean(TaskReadService.class)
    TaskReadService inMemoryTaskReadService() {
        return new InMemoryTaskReadService();
    }
}
