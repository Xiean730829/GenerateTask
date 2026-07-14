// 业务语义 API 服务契约。
// mock 与真实 Java adapter 都实现同一组接口；页面只依赖这里，不知道 URL / HTTP / WS 细节。
import type {
  Asset,
  CreateProjectInput,
  CreateProjectResult,
  Episode,
  Export,
  ExportOptions,
  GenerationTask,
  Id,
  Keyframe,
  Panel,
  PanelVideo,
  Project,
  ProjectSummary,
  Script,
  Shot,
  SourceMaterial,
  Timeline,
  UpdateAssetInput,
  UpdateCharacterInput,
  UpdateScriptInput,
  UpdateShotInput,
  UpdateSourceMaterialInput,
  VideoCapability,
} from '@/api/types'
import type { CreateAssetForShotInput } from '@/api/types/asset'

export interface ProjectService {
  listRecent(): Promise<ProjectSummary[]>
  get(projectId: Id): Promise<Project>
  create(input: CreateProjectInput): Promise<CreateProjectResult>
}

export interface EpisodeService {
  get(episodeId: Id): Promise<Episode>
  listByProject(projectId: Id): Promise<Episode[]>
  getVideoCapability(episodeId: Id): Promise<VideoCapability>
}

export interface SourceMaterialService {
  getByEpisode(episodeId: Id): Promise<SourceMaterial>
  update(id: Id, input: UpdateSourceMaterialInput): Promise<SourceMaterial>
}

export interface ScriptService {
  getByEpisode(episodeId: Id): Promise<Script | null>
  update(scriptId: Id, input: UpdateScriptInput): Promise<Script>
  confirmAndGenerateShots(scriptId: Id): Promise<{ taskId: Id }>
}

export interface ShotService {
  listByEpisode(episodeId: Id): Promise<Shot[]>
  update(shotId: Id, input: UpdateShotInput): Promise<Shot>
}

export interface AssetService {
  listUserLibrary(): Promise<Asset[]>
  listForShot(shotId: Id): Promise<Asset[]>
  prepareForShot(shotId: Id): Promise<{ taskId: Id }>
  attachToShot(shotId: Id, assetId: Id): Promise<void>
  detachFromShot(shotId: Id, assetId: Id): Promise<void>
  createForShot(shotId: Id, input: CreateAssetForShotInput): Promise<Asset>
  updateCharacter(id: Id, input: UpdateCharacterInput): Promise<Asset>
  update(id: Id, input: UpdateAssetInput): Promise<Asset>
  createRevision(id: Id): Promise<Asset>
  generateReferenceImage(id: Id): Promise<{ taskId: Id }>
  confirmReferenceImage(id: Id, mediaFileId: Id): Promise<Asset>
}

export interface KeyframeService {
  listByEpisode(episodeId: Id): Promise<Keyframe[]>
  generateNextBatch(episodeId: Id): Promise<{ taskId: Id; shotIds: Id[] }>
  regenerate(shotId: Id): Promise<{ taskId: Id }>
  select(keyframeId: Id): Promise<Keyframe>
}

export interface PanelService {
  listByEpisode(episodeId: Id): Promise<Panel[]>
  assemble(episodeId: Id): Promise<Panel[]>
}

export interface PanelVideoService {
  listByEpisode(episodeId: Id): Promise<PanelVideo[]>
  generate(panelId: Id): Promise<{ taskId: Id }>
  generateBatch(episodeId: Id): Promise<{ taskIds: Id[] }>
}

export interface TimelineService {
  getByEpisode(episodeId: Id): Promise<Timeline | null>
  generateAudioSubtitle(episodeId: Id): Promise<{ taskId: Id }>
  compose(episodeId: Id): Promise<Timeline>
}

export interface ExportService {
  getByEpisode(episodeId: Id): Promise<Export | null>
  create(episodeId: Id, options: ExportOptions): Promise<{ taskId: Id }>
}

export interface TaskService {
  listByEpisode(episodeId: Id): Promise<GenerationTask[]>
  get(taskId: Id): Promise<GenerationTask>
  cancel(taskId: Id): Promise<GenerationTask>
  retry(taskId: Id): Promise<GenerationTask>
}
