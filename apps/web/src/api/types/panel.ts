import type { Freshness, Id, IsoDateTime } from './common'

/** Panel 视频生成状态。 */
export type PanelVideoStatus =
  | 'none' // 未生成
  | 'generating' // 生成中
  | 'ready' // 已生成且有效
  | 'failed' // 失败
  | 'stale' // 已失效，需重新生成

/**
 * Panel（剧情片段）：按视频能力时长上限贪心组装的多个已确认 Shot 及其选定关键帧。
 * Panel 是视频生成和视频重做的最小单位；MS1 中 Panel 列表只读。
 */
export interface Panel {
  id: Id
  episodeId: Id
  order: number
  /** 组装进本 Panel 的 Shot id（保持原顺序）。 */
  shotIds: Id[]
  /** 各成员 Shot 选定关键帧的快照，用于失效比对。 */
  keyframeIds: Id[]
  /** 合计时长（秒），由后端组装给出。 */
  durationSec: number
  createdAt: IsoDateTime
}

/** Panel 的视频产物与任务状态（就地展示于卡片）。 */
export interface PanelVideo {
  panelId: Id
  status: PanelVideoStatus
  freshness: Freshness
  /** 成功后的视频预览地址。 */
  videoUrl: string | null
  taskId: Id | null
  updatedAt: IsoDateTime
}
