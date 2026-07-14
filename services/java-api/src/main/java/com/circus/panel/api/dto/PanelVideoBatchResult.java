package com.circus.panel.api.dto;

import com.circus.task.api.dto.GenerationTaskResponse;
import java.util.List;

public record PanelVideoBatchResult(List<GenerationTaskResponse> tasks) {}
