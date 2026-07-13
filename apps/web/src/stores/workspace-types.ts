import type {
  Asset,
  ConnectionState,
  Episode,
  ExportJob,
  GenerationTask,
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
} from '@/api'

/** 数据加载状态。 */
export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/** Episode 工作台的全部前端状态。任务事件按 taskId 就地映射到这些对象。 */
export interface WorkspaceState {
  load: LoadState
  error: string | null
  connection: ConnectionState

  project: Project | null
  episode: Episode | null
  sourceMaterial: SourceMaterial | null
  script: Script | null
  shots: Shot[]
  assets: Asset[]
  assetsLocked: boolean
  keyframes: ShotKeyframes[]
  panels: Panel[]
  panelVideos: PanelVideo[]
  timeline: Timeline | null
  exportJob: ExportJob | null
  videoCapability: VideoCapability | null

  /** 当前 episode 的任务快照，按 taskId 索引。 */
  tasks: Record<Id, GenerationTask>
}

export const initialWorkspaceState: WorkspaceState = {
  load: 'idle',
  error: null,
  connection: 'connecting',
  project: null,
  episode: null,
  sourceMaterial: null,
  script: null,
  shots: [],
  assets: [],
  assetsLocked: false,
  keyframes: [],
  panels: [],
  panelVideos: [],
  timeline: null,
  exportJob: null,
  videoCapability: null,
  tasks: {},
}
