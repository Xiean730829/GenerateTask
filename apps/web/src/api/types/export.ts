import type { AspectRatio, ExportFormat, Id, IsoDateTime, Resolution } from './common'

export type ExportStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'

/** 导出参数（UI 表单）。 */
export interface ExportOptions {
  format: ExportFormat
  aspectRatio: AspectRatio
  resolution: Resolution
}

/** Export，与 export.schema.json 对齐。 */
export interface Export {
  id: Id
  timelineId: Id
  taskId: Id | null
  status: ExportStatus
  fileUrl: string | null
  objectKey: string | null
  format: string | null
  resolution: string | null
  durationSeconds: number | null
  sizeBytes: number | null
  createdAt: IsoDateTime
  finishedAt: IsoDateTime | null
}
