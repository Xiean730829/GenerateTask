import type {
  Asset,
  Episode,
  Export,
  Id,
  Keyframe,
  Panel,
  PanelRevision,
  PanelVideo,
  Project,
  Script,
  Shot,
  ShotAssetOverride,
  SourceMaterial,
  Timeline,
  VideoCapability,
} from '@/api/types'

export interface EpisodeState {
  episode: Episode
  sourceMaterial: SourceMaterial
  script: Script | null
  shots: Shot[]
  keyframes: Keyframe[]
  shotAssetOverrides: ShotAssetOverride[]
  panels: Panel[]
  panelRevisions: PanelRevision[]
  panelVideos: PanelVideo[]
  timeline: Timeline | null
  exportRecord: Export | null
  failedOnce: Set<string>
}

export class MockDb {
  readonly projects = new Map<Id, Project>()
  readonly episodes = new Map<Id, EpisodeState>()
  readonly userAssets: Asset[] = []
  readonly recentProjectIds: Id[] = []
  readonly mediaUrls = new Map<Id, string>()

  readonly videoCapability: VideoCapability = {
    minPanelDurationSeconds: 5,
    maxPanelDurationSeconds: 15,
    supportedDurationsSeconds: [5, 10, 15],
  }

  getEpisodeState(episodeId: Id): EpisodeState {
    const state = this.episodes.get(episodeId)
    if (!state) throw new Error(`Episode 不存在：${episodeId}`)
    return state
  }

  getProject(projectId: Id): Project {
    const project = this.projects.get(projectId)
    if (!project) throw new Error(`Project 不存在：${projectId}`)
    return project
  }

  touchRecent(projectId: Id): void {
    const idx = this.recentProjectIds.indexOf(projectId)
    if (idx >= 0) this.recentProjectIds.splice(idx, 1)
    this.recentProjectIds.unshift(projectId)
  }
}
