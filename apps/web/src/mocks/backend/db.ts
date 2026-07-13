// Mock 内存数据库：保存单一演示用户的全部业务对象。
import type {
  Asset,
  Episode,
  ExportJob,
  Id,
  Panel,
  PanelVideo,
  Project,
  Script,
  Shot,
  ShotKeyframes,
  SourceMaterial,
  Timeline,
  VideoCapability,
} from '@/api/types'

/** 单个 Episode 下的全部生产数据。 */
export interface EpisodeState {
  episode: Episode
  sourceMaterial: SourceMaterial
  script: Script | null
  shots: Shot[]
  keyframes: ShotKeyframes[]
  panels: Panel[]
  panelVideos: PanelVideo[]
  timeline: Timeline | null
  exportJob: ExportJob | null
  /** 已消费过“首次失败”演示额度的任务类型，保证重试后成功。 */
  failedOnce: Set<string>
}

export class MockDb {
  readonly projects = new Map<Id, Project>()
  readonly episodes = new Map<Id, EpisodeState>()
  /** 单一演示用户的素材库；真实服务以登录用户为边界。 */
  readonly userAssets: Asset[] = []
  /** 项目最近顺序，最新在前。 */
  readonly recentProjectIds: Id[] = []

  /** 当前所选视频 API 能力（全局，MS1 单一）。前端不写死。 */
  readonly videoCapability: VideoCapability = {
    provider: 'mock-video-1',
    maxClipDurationSec: 15,
    supportedDurationsSec: [5, 10, 15],
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
