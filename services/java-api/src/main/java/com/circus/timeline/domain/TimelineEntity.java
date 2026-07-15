package com.circus.timeline.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "timeline")
public class TimelineEntity {
    @Id @Column(name = "id", nullable = false) private UUID id;
    @Column(name = "episode_id", nullable = false) private UUID episodeId;
    @Column(name = "status", nullable = false, length = 32) private String status;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "video_track", columnDefinition = "jsonb") private JsonNode videoTrack;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "audio_track", columnDefinition = "jsonb") private JsonNode audioTrack;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "subtitle_track", columnDefinition = "jsonb") private JsonNode subtitleTrack;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    protected TimelineEntity() {}
}
