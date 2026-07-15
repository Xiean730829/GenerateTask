package com.circus.security.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Persistence model for the MS1 demo user and future authenticated users. */
@Entity
@Table(name = "app_user")
public class AppUserEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AppUserEntity() {}
}
