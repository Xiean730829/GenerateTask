package com.circus.orchestration.application;

import com.circus.orchestration.api.TaskResultHandler;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** 将 taskType 映射到唯一内容 handler，重复注册会在启动时失败。 */
// @Component：自动收集 Spring 容器中所有 TaskResultHandler 实现。
@Component
public class TaskResultHandlerRegistry {

    private final Map<String, TaskResultHandler> handlers;

    /** Spring 注入所有 handler；toUnmodifiableMap 会把重复 taskType 立即暴露为启动失败。 */
    public TaskResultHandlerRegistry(List<TaskResultHandler> handlers) {
        this.handlers = handlers.stream().collect(Collectors.toUnmodifiableMap(
                TaskResultHandler::taskType, Function.identity()));
    }

    public Optional<TaskResultHandler> find(String taskType) {
        return Optional.ofNullable(handlers.get(taskType));
    }
}
