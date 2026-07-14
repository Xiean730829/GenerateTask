package com.circus.messaging;

/**
 * messaging 向 task 回传 broker 确认结果的单向 seam。
 * 齐广志应在 task 模块实现它：ack 时把 execution/task 标记 queued；nack/return 时记录失败原因。
 */
public interface PublishOutcomeListener {

    void onPublished(TaskPublication publication);

    void onPublishFailed(TaskPublication publication, String errorCode, String reason);
}
