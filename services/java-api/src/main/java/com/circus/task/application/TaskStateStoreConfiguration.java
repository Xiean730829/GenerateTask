package com.circus.task.application;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 在齐广志的真实仓储适配器接入前提供可启动、可替换的空跑状态仓储。 */
// @Configuration：集中声明 fallback Bean，避免把占位实现混入正式业务组件扫描。
@Configuration
class TaskStateStoreConfiguration {

    /** @Bean：把内存实现暴露为 TaskStateStore 接口。 */
    @Bean
    // @ConditionalOnMissingBean：真实 TaskStateStore 接入后自动优先使用真实实现。
    @ConditionalOnMissingBean(TaskStateStore.class)
    TaskStateStore inMemoryTaskStateStore() {
        return new InMemoryTaskStateStore();
    }
}
