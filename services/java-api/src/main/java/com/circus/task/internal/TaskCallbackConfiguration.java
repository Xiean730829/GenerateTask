package com.circus.task.internal;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** 真实 TaskCallbackService 尚未接入时提供可启动的安全忽略实现。 */
// @Configuration：集中配置回写服务的 fallback，避免误注册为正式业务实现。
@Configuration
class TaskCallbackConfiguration {

    /** @Bean：提供只返回 ignored 的占位回写服务，绝不修改任务状态。 */
    @Bean
    // @ConditionalOnMissingBean：真实校验/状态机实现接入后，此实现不会创建。
    @ConditionalOnMissingBean
    TaskCallbackService noOpTaskCallbackService() {
        return result -> new TaskResultAcknowledgement(result.taskId(), true);
    }
}
