package com.circus.project.api.dto;

import com.circus.episode.api.dto.EpisodeResponse;
import com.circus.material.api.dto.SourceMaterialResponse;

public record CreateProjectResultResponse(ProjectResponse project, EpisodeResponse defaultEpisode,
                                          SourceMaterialResponse sourceMaterial) {}
