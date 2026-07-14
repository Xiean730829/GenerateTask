package com.circus.orchestration.api;

import com.circus.task.api.event.TaskSucceededEvent;
import java.util.Optional;

/**
 * 某个 taskType 成功后保存业务结果并决定是否继续的内容侧 seam。
 * 内容负责人在 orchestration/application 新建实现类，声明唯一 taskType，并保存 Script/Shot/Panel 等领域数据。
 */
public interface TaskResultHandler {

    String taskType();

    Optional<NextStep> handle(TaskSucceededEvent event);
}
