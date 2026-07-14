package com.circus.media.api;
import com.circus.common.api.ApiEnvelope; import com.circus.media.api.dto.MediaFileResponse; import java.util.UUID; import org.springframework.web.bind.annotation.*;
@RequestMapping("/api") public interface MediaFileApi { @GetMapping("/media-files/{mediaFileId}") ApiEnvelope<MediaFileResponse> getMediaFile(@PathVariable UUID mediaFileId); }
