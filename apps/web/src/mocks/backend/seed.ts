import type { Episode, Project, Shot } from '@/api/types'
import type { EpisodeState } from './db'
import type { MockBackend } from './index'
import { generateAssets, generateKeyframes, generateScriptContent, generateShots, mediaUrlFor } from './content'

export const SEED_PROJECT_COVERS: Record<string, string> = {
  proj_seed_sanzhi: '/images/demo-project-coast.png',
  proj_seed_yuye: '/images/demo-project-pier.png',
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function baseEpisodeState(episode: Episode, projectId: string, sourceText: string, ts: string): EpisodeState {
  return {
    episode,
    sourceMaterial: {
      id: `src_${episode.id}`,
      projectId,
      type: 'text',
      text: sourceText,
      title: null,
      status: 'ready',
      createdAt: ts,
    },
    script: null,
    shots: [],
    keyframes: [],
    shotAssetOverrides: [],
    panels: [],
    panelRevisions: [],
    panelVideos: [],
    timeline: null,
    exportRecord: null,
    failedOnce: new Set(),
  }
}

function registerProject(
  backend: MockBackend,
  config: {
    projectId: string
    episodeId: string
    name: string
    sourceText: string
    aspectRatio: string
    style: string | null
    updatedAt: string
    mutate: (state: EpisodeState, ts: string) => void
  },
): void {
  const { projectId, episodeId, name, sourceText, aspectRatio, style, updatedAt } = config
  const createdAt = daysAgo(21)
  const episode: Episode = {
    id: episodeId,
    projectId,
    title: '第 1 集',
    synopsis: null,
    orderIndex: 0,
    targetDurationSeconds: 45,
    status: 'active',
    createdAt,
    updatedAt,
  }
  const project: Project = {
    id: projectId,
    ownerUserId: 'demo-user',
    name,
    projectType: 'single_episode',
    stage: 'shot',
    targetDurationSeconds: 45,
    aspectRatio,
    style,
    defaultEpisodeId: episodeId,
    createdAt,
    updatedAt,
  }
  const state = baseEpisodeState(episode, projectId, sourceText, createdAt)
  config.mutate(state, updatedAt)
  backend.db.projects.set(projectId, project)
  backend.db.episodes.set(episodeId, state)
  backend.db.touchRecent(projectId)
}

export function seedDemoProjects(backend: MockBackend): void {
  if (backend.db.recentProjectIds.length > 0) return
  if (backend.db.userAssets.length === 0) backend.db.userAssets.push(...generateAssets())

  registerProject(backend, {
    projectId: 'proj_seed_yuye',
    episodeId: 'ep_seed_yuye',
    name: '雨夜重逢',
    sourceText: '暴雨夜，分手多年的恋人在便利店门口偶遇。',
    aspectRatio: '9:16',
    style: '赛博霓虹',
    updatedAt: daysAgo(4),
    mutate: (state, ts) => {
      const episodeId = state.episode.id
      const scriptId = 'script_seed_yuye'
      state.script = {
        id: scriptId,
        episodeId,
        title: null,
        logline: null,
        content: generateScriptContent(state.sourceMaterial.text ?? ''),
        scenes: [],
        version: 1,
        status: 'confirmed',
        confirmedAt: ts,
        createdAt: ts,
        updatedAt: ts,
      }
      state.shots = generateShots(episodeId, scriptId)
      state.keyframes = state.shots.flatMap((shot: Shot, i: number) => {
        const kf = generateKeyframes(shot.id, i + 10)[0]
        backend.db.mediaUrls.set(kf.mediaFileId, mediaUrlFor(kf.mediaFileId, i))
        return [{ ...kf, status: i < 4 ? 'selected' as const : 'candidate' as const }]
      })
    },
  })

  registerProject(backend, {
    projectId: 'proj_seed_sanzhi',
    episodeId: 'ep_seed_sanzhi',
    name: '三年之约',
    sourceText: '三年未见的姐妹在天台重逢，揭开家族秘密。',
    aspectRatio: '9:16',
    style: '冷色胶片',
    updatedAt: daysAgo(1),
    mutate: (state, ts) => {
      const episodeId = state.episode.id
      const scriptId = 'script_seed_sanzhi'
      state.script = {
        id: scriptId,
        episodeId,
        title: null,
        logline: null,
        content: generateScriptContent(state.sourceMaterial.text ?? ''),
        scenes: [],
        version: 1,
        status: 'confirmed',
        confirmedAt: ts,
        createdAt: ts,
        updatedAt: ts,
      }
      state.shots = generateShots(episodeId, scriptId)
    },
  })
}
