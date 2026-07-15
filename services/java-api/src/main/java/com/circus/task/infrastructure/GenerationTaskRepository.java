package com.circus.task.infrastructure;

import com.circus.task.domain.GenerationTaskEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationTaskRepository extends JpaRepository<GenerationTaskEntity, UUID> {

    Optional<GenerationTaskEntity> findByOwnerUserIdAndIdempotencyOperationAndIdempotencyKey(
            UUID ownerUserId,
            String idempotencyOperation,
            String idempotencyKey);
}
