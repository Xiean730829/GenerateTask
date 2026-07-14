package com.circus.orchestration.application;

import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/** MS1 的自动串联开关表；真实任务默认 false，避免绕过用户确认。 */
// @Component：供 Dispatcher 注入统一判断，避免各 handler 私自决定事务外副作用。
@Component
public class PipelinePolicy {

    /** MS1 默认只落库和更新 stage；仅空跑任务允许自动进入临时 handler。 */
    private final Map<String, Boolean> automaticTaskTypes = Map.of(
            "__skeleton__", true,
            "script.generate", false,
            "shot.generate", false,
            "asset.extract", false,
            "asset.image.generate", false,
            "keyframe.generate", false,
            "video.generate", false,
            "audio.subtitle", false,
            "export.compose", false);

    /** 内容负责人确认某类任务需要自动串联时，在上表改为 true。 */
    public boolean automaticallyChains(String taskType) {
        return automaticTaskTypes.getOrDefault(taskType, false);
    }
}
