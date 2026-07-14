package com.circus.orchestration.application;

import com.circus.orchestration.api.ScriptResultStore;
import com.circus.orchestration.api.ShotResultStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 在真实 Script/Shot 持久化服务接入前提供空实现，保证基础设施上下文可以启动。 */
// @Configuration：集中声明内容结果存储的可替换 fallback。
@Configuration
class ContentResultStoreConfiguration {

    /** @Bean：没有真实 ScriptResultStore 时不丢弃任务事件，只作为空跑占位。 */
    @Bean
    // @ConditionalOnMissingBean：真实内容存储 Bean 接入后自动让位。
    @ConditionalOnMissingBean(ScriptResultStore.class)
    ScriptResultStore noOpScriptResultStore() {
        return event -> {};
    }

    /** @Bean：没有真实 ShotResultStore 时提供空跑占位。 */
    @Bean
    // @ConditionalOnMissingBean：真实内容存储 Bean 接入后自动让位。
    @ConditionalOnMissingBean(ShotResultStore.class)
    ShotResultStore noOpShotResultStore() {
        return event -> {};
    }
}
