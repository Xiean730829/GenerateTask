package com.circus.task.application;

import com.circus.messaging.TaskMessagePublisher;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** 只在创建任务事务提交后才向 Worker 发布，避免消费未提交的任务。 */
// @Component：注册事务事件监听器。
@Component
// @ConditionalOnBean：RabbitMQ 未启用时，健康检查等轻量上下文仍可启动。
@ConditionalOnBean(TaskMessagePublisher.class)
public class TaskDispatchAfterCommitPublisher {

    private final TaskMessagePublisher taskMessagePublisher;

    public TaskDispatchAfterCommitPublisher(TaskMessagePublisher taskMessagePublisher) {
        this.taskMessagePublisher = taskMessagePublisher;
    }

    // @TransactionalEventListener(AFTER_COMMIT)：只有数据库提交成功，才把任务交给 Python Worker。
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publish(TaskDispatchRequestedEvent event) {
        taskMessagePublisher.publish(event.dispatch().toExecutionMessage());
    }
}
