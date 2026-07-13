// 通用领域基础类型。
// 这些类型在 mock 与真实 Java API 之间保持一致，页面只依赖此处定义。

export type Id = string

export type IsoDateTime = string

/** 画幅比例；MS1 默认 9:16。 */
export type AspectRatio = '9:16' | '16:9' | '1:1'

/** 导出清晰度。 */
export type Resolution = '480p' | '720p' | '1080p'

/** 导出封装格式。 */
export type ExportFormat = 'mp4' | 'mov'

/**
 * 业务对象的“新鲜度”。任一上游 Shot / 关键帧改动会把下游对象标记为 stale。
 */
export type Freshness = 'fresh' | 'stale'

/** 分页返回。真实 API 若需要游标分页可在 adapter 内适配到此形状。 */
export interface Page<T> {
  items: T[]
  total: number
}
