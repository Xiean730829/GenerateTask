import type { Id, IsoDateTime } from './common'

/**
 * GenerationTask 的类型。MS1 的每个异步动作都落到其中一种。
 * 素材抽取虽是“项目级”动作，但任务仍必须关联 episodeId。
 */
export type TaskType =
  | 'script.generate'
  | 'shot.generate'
  | 'asset.extract'
  | 'asset.image.generate'
  | 'keyframe.generate'
  | 'panel.assemble'
  | 'panel-video.generate'
  | 'timeline.compose'
  | 'export.render'

/** 任务状态机。retrying 为失败重试后的过渡态，canceled 为用户取消。 */
export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'canceled'

export interface TaskError {
  code: string
  message: string
  /** 是否可重试，以服务端为准；前端不猜测。 */
  retryable: boolean
}

/** 完整任务快照。WebSocket 事件与任务查询接口返回同一形状。 */
export interface GenerationTask {
  taskId: Id
  episodeId: Id
  taskType: TaskType
  status: TaskStatus
  /** 0–100。 */
  progress: number
  /** 任务产物的引用信息（如 scriptId、panelId 列表）；终态成功时非空。 */
  result: unknown | null
  error: TaskError | null
  updatedAt: IsoDateTime
}

/** Episode 范围 WebSocket 推送的任务更新事件（完整状态快照）。 */
export interface TaskUpdatedEvent {
  type: 'task.updated'
  data: GenerationTask
}

/** 终态：不再推送，前端停止订阅该任务。 */
export const TERMINAL_TASK_STATUSES: readonly TaskStatus[] = [
  'succeeded',
  'failed',
  'canceled',
]

export function isTerminalStatus(status: TaskStatus): boolean {
  return TERMINAL_TASK_STATUSES.includes(status)
}

/** 仅 pending / queued 可取消。 */
export function isCancelable(status: TaskStatus): boolean {
  return status === 'pending' || status === 'queued'
}
