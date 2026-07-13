/**
 * 视频生成能力：由服务层（视频 API / 模型）提供的时长约束。
 * 前端不写死秒数；Panel 贪心组装与视频任务表单都以此驱动。
 */
export interface VideoCapability {
  /** 当前所选视频 API / 模型标识。 */
  provider: string
  /** 单段视频最大时长（秒），Panel 组装上限。 */
  maxClipDurationSec: number
  /** 可选的目标时长档位（秒）。 */
  supportedDurationsSec: number[]
}
