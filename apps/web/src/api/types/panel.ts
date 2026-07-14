import type { Id, IsoDateTime } from './common'

export type PanelVideoStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'stale'

/** Panel，与 panel.schema.json 对齐。 */
export interface Panel {
  id: Id
  episodeId: Id
  name: string | null
  orderIndex: number
  shotIds: Id[]
  durationSeconds: number | null
  timeSpec: Record<string, unknown>
  currentRevisionId: Id | null
  createdAt: IsoDateTime
}

/** PanelRevision，与 panel-revision.schema.json 对齐。 */
export interface PanelRevision {
  id: Id
  panelId: Id
  revisionNo: number
  shotPromptRevisionIds: Id[]
  assetRevisionIds: Id[]
  keyframeMediaIds: Id[]
  createdAt: IsoDateTime
}

/** PanelVideo，与 panel-video.schema.json 对齐。 */
export interface PanelVideo {
  id: Id
  panelId: Id
  panelRevisionId: Id
  taskId: Id | null
  mediaFileId: Id | null
  status: PanelVideoStatus
  createdAt: IsoDateTime
  /** mock / adapter 解析的预览地址。 */
  videoUrl?: string | null
}

export function isPanelVideoReady(video: PanelVideo): boolean {
  return video.status === 'succeeded'
}

export function isPanelVideoRunning(video: PanelVideo): boolean {
  return video.status === 'running'
}

export function needsPanelVideoGeneration(video: PanelVideo): boolean {
  return video.status === 'pending' || video.status === 'failed' || video.status === 'stale'
}
