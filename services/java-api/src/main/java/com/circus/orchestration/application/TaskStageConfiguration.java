package com.circus.orchestration.application;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 未接入阶段服务时的安全空实现，保证失败事件不会阻止 MS1 空跑。 */
// @Configuration：声明可被正式实现覆盖的 fallback Bean。
@Configuration
class TaskStageConfiguration {

    /** @Bean：暴露空 stage 更新器。 */
    @Bean
    // @ConditionalOnMissingBean：内容负责人提供真实实现后自动让位。
    @ConditionalOnMissingBean
    TaskStageUpdater noOpTaskStageUpdater() {
        return event -> {};
    }
}
