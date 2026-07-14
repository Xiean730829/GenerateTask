// 通用领域基础类型，与 packages/contracts 对齐。

export type Id = string

export type IsoDateTime = string

/** 画幅比例；MS1 默认 9:16。 */
export type AspectRatio = '9:16' | '16:9' | '1:1'

/** 导出清晰度（UI 选项；写入 Export.resolution 时转为如 1080x1920）。 */
export type Resolution = '480p' | '720p' | '1080p'

/** 导出封装格式。 */
export type ExportFormat = 'mp4' | 'mov'

/** REST 响应包络，见 openapi-public.yaml SuccessEnvelope / ErrorEnvelope。 */
export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: ApiErrorPayload | null
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  constructor(readonly payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
  }
}

/** 分页返回。 */
export interface Page<T> {
  items: T[]
  total: number
}
