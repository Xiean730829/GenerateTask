package com.circus.orchestration.application;

import com.circus.orchestration.api.NextStep;
import com.circus.orchestration.api.TaskResultHandler;
import com.circus.task.api.event.TaskSucceededEvent;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** G1 空跑验收专用 handler；不写业务数据，也不创建后续任务。 */
// @Component：使注册表能自动发现该空跑 handler。
@Component
public class NoOpTaskResultHandler implements TaskResultHandler {

    @Override
    public String taskType() {
        return "__skeleton__";
    }

    @Override
    public Optional<NextStep> handle(TaskSucceededEvent event) {
        return Optional.of(new NextStep.None());
    }
}
