package com.circus.orchestration.api;

import com.circus.task.api.event.TaskSucceededEvent;

/** Shot 结果落库 seam；内容负责人应在此接入 ShotEntity/Repository 和 shot-list 校验。 */
@FunctionalInterface
public interface ShotResultStore {

    void save(TaskSucceededEvent event);
}
