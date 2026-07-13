import type { EpisodeTaskEventSource } from './event-source'
import type {
  AssetService,
  EpisodeService,
  ExportService,
  KeyframeService,
  PanelService,
  PanelVideoService,
  ProjectService,
  ScriptService,
  ShotService,
  SourceMaterialService,
  TaskService,
  TimelineService,
} from './services'

/**
 * 统一 API 客户端：聚合全部业务服务与任务事件源。
 * mock adapter 与真实 Java adapter 都实现此接口，adapter 选择入口返回它。
 */
export interface ApiClient {
  projects: ProjectService
  episodes: EpisodeService
  sourceMaterials: SourceMaterialService
  scripts: ScriptService
  shots: ShotService
  assets: AssetService
  keyframes: KeyframeService
  panels: PanelService
  panelVideos: PanelVideoService
  timelines: TimelineService
  exports: ExportService
  tasks: TaskService
  taskEvents: EpisodeTaskEventSource
}
