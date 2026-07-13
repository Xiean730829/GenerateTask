import type { Id, IsoDateTime } from './common'

/**
 * 关键帧：为单个 Shot 生成的静态候选画面。
 * 用户为每个 Shot 选择最终关键帧后才可组装 Panel。
 */
export interface Keyframe {
  id: Id
  shotId: Id
  /** 预览图地址（mock 使用占位图）。 */
  imageUrl: string
  createdAt: IsoDateTime
}

/** 单个 Shot 的关键帧生成与选择状态。 */
export interface ShotKeyframes {
  shotId: Id
  candidates: Keyframe[]
  /** 已选最终关键帧 id，未选为 null。 */
  selectedKeyframeId: Id | null
  /** 当前该 Shot 的关键帧生成任务 id。 */
  taskId: Id | null
}
