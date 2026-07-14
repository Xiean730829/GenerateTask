package com.circus.task.internal;

/**
 * 回写校验和状态转换 seam；有效状态变更后由实现发布 TaskLifecycleEvent。
 * 齐广志应实现：按 messageId 查 execution，核对 taskId/attempt/当前状态；旧 execution 或重复回写返回 ignored=true。
 */
public interface TaskCallbackService {

    TaskResultAcknowledgement handle(TaskResult result);
}
