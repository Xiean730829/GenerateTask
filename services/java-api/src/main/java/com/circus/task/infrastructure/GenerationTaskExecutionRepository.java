package com.circus.task.infrastructure;

import com.circus.task.domain.GenerationTaskExecutionEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationTaskExecutionRepository
        extends JpaRepository<GenerationTaskExecutionEntity, UUID> {

    Optional<GenerationTaskExecutionEntity> findByTaskIdAndAttempt(UUID taskId, Integer attempt);
}
