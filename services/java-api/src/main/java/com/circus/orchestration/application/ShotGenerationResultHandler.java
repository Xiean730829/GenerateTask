package com.circus.orchestration.application;

import com.circus.orchestration.api.NextStep;
import com.circus.orchestration.api.ShotResultStore;
import com.circus.orchestration.api.TaskResultHandler;
import com.circus.task.api.event.TaskSucceededEvent;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** shot.generate 成功结果处理器；先保存 Shot，后续是否批量生成由用户确认。 */
// @Component：自动注册到 TaskResultHandlerRegistry。
@Component
public class ShotGenerationResultHandler implements TaskResultHandler {

    private final ShotResultStore resultStore;

    public ShotGenerationResultHandler(ShotResultStore resultStore) {
        this.resultStore = resultStore;
    }

    @Override
    public String taskType() {
        return "shot.generate";
    }

    @Override
    public Optional<NextStep> handle(TaskSucceededEvent event) {
        resultStore.save(event);
        return Optional.empty();
    }
}
