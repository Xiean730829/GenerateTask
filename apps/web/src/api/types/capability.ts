/**
 * 视频生成能力：由服务层提供的 Panel 时长约束。
 * 与 openapi-public.yaml VideoCapability 对齐；前端不写死秒数。
 */
export interface VideoCapability {
  minPanelDurationSeconds: number
  maxPanelDurationSeconds: number
  supportedDurationsSeconds: number[]
}
