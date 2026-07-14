package com.circus.orchestration.application;

import com.circus.orchestration.api.NextStep;
import com.circus.orchestration.api.ScriptResultStore;
import com.circus.orchestration.api.TaskResultHandler;
import com.circus.task.api.event.TaskSucceededEvent;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** script.generate 成功结果处理器；先保存 Script，当前 MS1 不自动创建后续任务。 */
// @Component：自动注册到 TaskResultHandlerRegistry。
@Component
public class ScriptGenerationResultHandler implements TaskResultHandler {

    private final ScriptResultStore resultStore;

    public ScriptGenerationResultHandler(ScriptResultStore resultStore) {
        this.resultStore = resultStore;
    }

    @Override
    public String taskType() {
        return "script.generate";
    }

    @Override
    public Optional<NextStep> handle(TaskSucceededEvent event) {
        resultStore.save(event);
        return Optional.empty();
    }
}
