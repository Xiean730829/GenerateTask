import type {
  Asset,
  ConnectionState,
  Episode,
  Export,
  GenerationTask,
  Id,
  Keyframe,
  Panel,
  PanelVideo,
  Project,
  Script,
  Shot,
  SourceMaterial,
  Timeline,
  VideoCapability,
} from '@/api'

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

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
  keyframes: Keyframe[]
  panels: Panel[]
  panelVideos: PanelVideo[]
  timeline: Timeline | null
  exportRecord: Export | null
  videoCapability: VideoCapability | null
  tasks: Record<Id, GenerationTask>
  shotAssets: Record<Id, Asset[]>
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
  exportRecord: null,
  videoCapability: null,
  tasks: {},
  shotAssets: {},
}
