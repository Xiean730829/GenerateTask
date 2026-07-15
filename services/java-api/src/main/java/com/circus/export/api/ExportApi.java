package com.circus.export.api;

import com.circus.common.api.ApiEnvelope;
import com.circus.export.api.dto.CreateExportRequest;
import com.circus.export.api.dto.ExportResponse;
import com.circus.task.api.dto.GenerationTaskResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api")
public interface ExportApi {
    @GetMapping("/timelines/{timelineId}/exports")
    ApiEnvelope<List<ExportResponse>> listExports(@PathVariable UUID timelineId);

    @PostMapping("/timelines/{timelineId}/exports")
    ApiEnvelope<GenerationTaskResponse> createExport(
            @PathVariable UUID timelineId,
            @Valid @RequestBody(required = false) CreateExportRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey);

    @GetMapping("/exports/{exportId}")
    ApiEnvelope<ExportResponse> getExport(@PathVariable UUID exportId);

    @GetMapping("/exports/{exportId}/download")
    ResponseEntity<Void> downloadExport(@PathVariable UUID exportId);
}
