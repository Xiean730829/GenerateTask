// 业务语义 API 服务契约。
// mock 与真实 Java adapter 都实现同一组接口；页面只依赖这里，不知道 URL / HTTP / WS 细节。
import type {
  Asset,
  CharacterAsset,
  CreateProjectInput,
  CreateProjectResult,
  Episode,
  ExportEstimate,
  ExportJob,
  ExportOptions,
  GenerationTask,
  Id,
  Panel,
  PanelVideo,
  Project,
  ProjectSummary,
  Script,
  Shot,
  ShotKeyframes,
  SourceMaterial,
  Timeline,
  UpdateAssetInput,
  UpdateCharacterInput,
  UpdateScriptInput,
  UpdateShotInput,
  UpdateSourceMaterialInput,
  VideoCapability,
} from '@/api/types'

export interface ProjectService {
  listRecent(): Promise<ProjectSummary[]>
  get(projectId: Id): Promise<Project>
  /** 依次创建 Project、默认 Episode、文本 SourceMaterial 与剧本任务。 */
  create(input: CreateProjectInput): Promise<CreateProjectResult>
}

export interface EpisodeService {
  get(episodeId: Id): Promise<Episode>
  /** 项目下的分集列表，供左侧树状导航使用。 */
  listByProject(projectId: Id): Promise<Episode[]>
  /** 当前所选视频 API 的时长能力，驱动 Panel 组装与视频表单。 */
  getVideoCapability(episodeId: Id): Promise<VideoCapability>
}

export interface SourceMaterialService {
  getByEpisode(episodeId: Id): Promise<SourceMaterial>
  update(id: Id, input: UpdateSourceMaterialInput): Promise<SourceMaterial>
}

export interface ScriptService {
  getByEpisode(episodeId: Id): Promise<Script | null>
  update(scriptId: Id, input: UpdateScriptInput): Promise<Script>
  /** 确认剧本并创建镜头任务；返回镜头任务 id。 */
  confirmAndGenerateShots(scriptId: Id): Promise<{ taskId: Id }>
}

export interface ShotService {
  listByEpisode(episodeId: Id): Promise<Shot[]>
  /** 保存 Shot 编辑；返回受影响的下游对象数量用于失效提示。 */
  update(shotId: Id, input: UpdateShotInput): Promise<Shot>
}

export interface AssetService {
  /** 用户级分类素材库，可跨项目 / Episode 复用。 */
  listUserLibrary(): Promise<Asset[]>
  /** 当前镜头实际关联的素材；不再按整集统一提取。 */
  listForShot(shotId: Id): Promise<Asset[]>
  /** 根据镜头按需寻找用户库候选或创建缺失素材。 */
  prepareForShot(shotId: Id): Promise<{ taskId: Id }>
  /** 从用户级素材库关联 / 移除素材。 */
  attachToShot(shotId: Id, assetId: Id): Promise<void>
  detachFromShot(shotId: Id, assetId: Id): Promise<void>
  createForShot(shotId: Id, input: import('@/api/types').CreateAssetForShotInput): Promise<Asset>
  updateCharacter(id: Id, input: UpdateCharacterInput): Promise<CharacterAsset>
  update(id: Id, input: UpdateAssetInput): Promise<Asset>
  /** 确认素材文字定义后，才可生成其候选图。 */
  confirmDefinition(id: Id): Promise<Asset>
  /** 生成素材候选图；候选数量由服务能力决定。 */
  generateImage(id: Id): Promise<{ taskId: Id }>
  /** 从服务返回的候选图中确认一张，成为可复用素材。 */
  confirmImage(id: Id, imageUrl: string): Promise<Asset>
}

export interface KeyframeService {
  listByEpisode(episodeId: Id): Promise<ShotKeyframes[]>
  /** 按镜头顺序生成下一张九宫格：最多 9 个；尾部不足时保留空格。 */
  generateNextBatch(episodeId: Id): Promise<{ taskId: Id; shotIds: Id[] }>
  /** 为单个 Shot 重生成关键帧。 */
  regenerate(shotId: Id): Promise<{ taskId: Id }>
  /** 选择某 Shot 的最终关键帧。 */
  select(shotId: Id, keyframeId: Id): Promise<ShotKeyframes>
}

export interface PanelService {
  listByEpisode(episodeId: Id): Promise<Panel[]>
  /** 显式触发后端贪心组装并返回只读 Panel 列表。 */
  assemble(episodeId: Id): Promise<Panel[]>
}

export interface PanelVideoService {
  listByEpisode(episodeId: Id): Promise<PanelVideo[]>
  /** 单个 Panel 生成 / 重做视频。 */
  generate(panelId: Id): Promise<{ taskId: Id }>
  /** 批量：仅处理未生成、失败或失效的 Panel。 */
  generateBatch(episodeId: Id): Promise<{ taskIds: Id[] }>
}

export interface TimelineService {
  getByEpisode(episodeId: Id): Promise<Timeline | null>
  /** 所有 Panel 视频有效后显式合成时间线。 */
  compose(episodeId: Id): Promise<{ taskId: Id }>
}

export interface ExportService {
  getByEpisode(episodeId: Id): Promise<ExportJob | null>
  estimate(episodeId: Id, options: ExportOptions): Promise<ExportEstimate>
  /** 确认后创建 Export 任务。 */
  create(episodeId: Id, options: ExportOptions): Promise<{ taskId: Id }>
}

export interface TaskService {
  /** 按 episode 查询任务快照，用于连接 / 重连后校正状态。 */
  listByEpisode(episodeId: Id): Promise<GenerationTask[]>
  get(taskId: Id): Promise<GenerationTask>
  /** 仅 pending / queued 可取消。 */
  cancel(taskId: Id): Promise<GenerationTask>
  /** 仅 retryable 失败可重试。 */
  retry(taskId: Id): Promise<GenerationTask>
}
