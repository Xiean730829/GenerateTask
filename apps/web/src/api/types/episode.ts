import type { Id, IsoDateTime } from './common'

/** MS1 工作台阶段导航 key（前端 UI 概念，非 REST 实体）。 */
export type StageKey =
  | 'input'
  | 'script'
  | 'shot'
  | 'panel'
  | 'timeline'
  | 'export'

export type StageStatus =
  | 'done'
  | 'active'
  | 'pending'
  | 'failed'
  | 'stale'

/** 分集，与 episode.schema.json 对齐。 */
export interface Episode {
  id: Id
  projectId: Id
  title: string | null
  synopsis: string | null
  orderIndex: number
  targetDurationSeconds: number | null
  status: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
