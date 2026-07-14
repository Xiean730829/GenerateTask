package com.circus.orchestration.api;

import com.circus.task.api.dto.CreateTaskCommand;

/**
 * 编排的显式下一步：异步建任务、同步调用或不继续。
 * 内容 handler 只能返回这三种意图，真正的执行由 TaskResultDispatcher 统一完成。
 */
public sealed interface NextStep permits NextStep.Async, NextStep.Sync, NextStep.None {

    record Async(CreateTaskCommand command) implements NextStep {}

    record Sync(Runnable runnable) implements NextStep {}

    record None() implements NextStep {}
}
