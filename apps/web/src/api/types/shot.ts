import type { Id, IsoDateTime } from './common'

/** 景别。 */
export type ShotSize =
  | 'wide' // 远景
  | 'full' // 全景
  | 'medium' // 中景
  | 'close-up' // 特写
  | 'extreme-close-up' // 大特写

/** 运镜。 */
export type CameraMovement =
  | 'static' // 固定
  | 'pan' // 摇
  | 'tilt' // 俯仰
  | 'dolly' // 推拉
  | 'tracking' // 跟拍
  | 'zoom' // 变焦

/**
 * Shot 是结构化文本分镜，不是视频；它是关键帧和局部重做的最小单位。
 */
export interface Shot {
  id: Id
  episodeId: Id
  /** 顺序，从 1 开始。 */
  order: number
  /** 时长（秒）。用户可编辑，影响 Panel 组装。 */
  durationSec: number
  size: ShotSize
  movement: CameraMovement
  /** 动作描述。 */
  action: string
  /** 台词。 */
  dialogue: string
  /** 此镜头在用户级素材库中关联的素材。由“准备素材”按需补齐。 */
  materialAssetIds: Id[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** 用户可编辑的 Shot 字段。 */
export interface UpdateShotInput {
  durationSec?: number
  size?: ShotSize
  movement?: CameraMovement
  action?: string
  dialogue?: string
}
