package com.circus.task.application;

import org.springframework.context.ApplicationEvent;

/** 任务行保存成功后发布，供 AFTER_COMMIT 监听器异步投递；事件本身不向 RabbitMQ 发消息。 */
public class TaskDispatchRequestedEvent extends ApplicationEvent {

    private final TaskDispatch dispatch;

    public TaskDispatchRequestedEvent(Object source, TaskDispatch dispatch) {
        super(source);
        this.dispatch = dispatch;
    }

    public TaskDispatch dispatch() {
        return dispatch;
    }
}
