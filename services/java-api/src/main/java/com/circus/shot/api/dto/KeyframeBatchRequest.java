package com.circus.shot.api.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record KeyframeBatchRequest(@Size(min = 1, max = 9) List<UUID> shotIds) {}
