package com.circus.orchestration.application;

import com.circus.task.api.event.TaskFailedEvent;

/** 上层 Episode/Project 阶段标记的 seam；内容领域实现它，不在编排层硬编码表结构。 */
public interface TaskStageUpdater {

    void markFailed(TaskFailedEvent event);
}
