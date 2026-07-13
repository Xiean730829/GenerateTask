import type {
  AspectRatio,
  ExportFormat,
  Id,
  IsoDateTime,
  Resolution,
} from './common'

/** 导出参数。 */
export interface ExportOptions {
  format: ExportFormat
  aspectRatio: AspectRatio
  resolution: Resolution
}

/** 导出成本预估，导出确认前必须展示。 */
export interface ExportEstimate {
  options: ExportOptions
  /** 预计时长（秒）。 */
  durationSec: number
  /** 预估成本（演示用积分）。 */
  estimatedCost: number
  currency: string
}

export type ExportStatus = 'none' | 'rendering' | 'ready' | 'failed'

/** Export 任务与产物。 */
export interface ExportJob {
  id: Id
  episodeId: Id
  options: ExportOptions
  status: ExportStatus
  /** 成功后的下载地址。 */
  downloadUrl: string | null
  taskId: Id | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
