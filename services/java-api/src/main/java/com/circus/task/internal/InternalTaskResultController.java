package com.circus.task.internal;

import com.circus.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Worker 回写入口；鉴权由 InternalApiKeyFilter 在进入控制器前完成。 */
// @RestController：把本类注册为 HTTP JSON 控制器。
@RestController
// @RequestMapping：限制在内部接口域，避免与公开 /api 混用。
@RequestMapping("/internal")
public class InternalTaskResultController {

    private final TaskCallbackService taskCallbackService;

    public InternalTaskResultController(TaskCallbackService taskCallbackService) {
        this.taskCallbackService = taskCallbackService;
    }

    // @PostMapping：Python Worker 完成/进度变化后 POST 到该固定地址。
    @PostMapping("/tasks/{taskId}/result")
    public ApiEnvelope<TaskResultAcknowledgement> reportResult(@PathVariable UUID taskId,
                                                                // @Valid：触发 TaskResult 内的字段和嵌套 DTO 校验。
                                                                @Valid @RequestBody TaskResult result) {
        if (!taskId.equals(result.taskId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task id does not match result body");
        }
        return new ApiEnvelope<>(true, taskCallbackService.handle(result), null);
    }
}
