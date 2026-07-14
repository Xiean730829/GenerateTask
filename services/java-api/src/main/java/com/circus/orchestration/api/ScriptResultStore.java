package com.circus.orchestration.api;

import com.circus.task.api.event.TaskSucceededEvent;

/** Script 结果落库 seam；内容负责人应在此接入 ScriptEntity/Repository 和结果 schema 校验。 */
@FunctionalInterface
public interface ScriptResultStore {

    void save(TaskSucceededEvent event);
}
