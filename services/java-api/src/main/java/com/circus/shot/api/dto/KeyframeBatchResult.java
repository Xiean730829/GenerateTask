package com.circus.shot.api.dto;

import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;
import java.util.UUID;

public record KeyframeBatchResult(GenerationTaskResponse task, List<UUID> shotIds) {}
