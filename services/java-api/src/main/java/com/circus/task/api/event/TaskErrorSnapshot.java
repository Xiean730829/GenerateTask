package com.circus.task.api.event;

/** 生命周期事件携带的错误快照，供编排与 WebSocket 直接读取，无需回查 HTTP DTO。 */
public record TaskErrorSnapshot(String code, String message, Boolean retryable) {}
