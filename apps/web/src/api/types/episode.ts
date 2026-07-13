import type { Id, IsoDateTime } from './common'

/** MS1 的生产阶段，与顶部阶段导航一一对应。 */
export type StageKey =
  | 'input'
  | 'script'
  | 'shot'
  | 'panel'
  | 'timeline'
  | 'export'

/** 阶段在导航中的展示状态。 */
export type StageStatus =
  | 'done' // 已完成
  | 'active' // 进行中
  | 'pending' // 待处理（前置未满足或未开始）
  | 'failed' // 该阶段任务失败
  | 'stale' // 因上游改动而失效

/** 单集，MS1 工作台的核心范围。 */
export interface Episode {
  id: Id
  projectId: Id
  title: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
