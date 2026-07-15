package com.circus.material.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Persistence model for textual or uploaded source material. */
@Entity
@Table(name = "source_material")
public class SourceMaterialEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "type", nullable = false, length = 16)
    private String type;

    @Column(name = "text")
    private String text;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "source_media_file_id")
    private UUID sourceMediaFileId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SourceMaterialEntity() {}
}
