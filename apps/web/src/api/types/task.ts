import type { Id, IsoDateTime } from './common'

/**
 * GenerationTask 类型，与 generation-task.schema.json 对齐。
 * panel.assemble / timeline.compose 为同步 Java 聚合，无对应 taskType。
 */
export type TaskType =
  | 'script.generate'
  | 'shot.generate'
  | 'asset.extract'
  | 'asset.image.generate'
  | 'keyframe.generate'
  | 'video.generate'
  | 'audio.subtitle'
  | 'export.compose'

export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'canceled'

/** 完整任务快照（REST）。WebSocket 事件在 adapter 层将 taskId 归一为 id。 */
export interface GenerationTask {
  id: Id
  projectId: Id
  episodeId: Id
  shotId: Id | null
  panelId: Id | null
  taskType: TaskType
  status: TaskStatus
  attempt: number
  progress: number
  errorCode: string | null
  errorMessage: string | null
  retryable: boolean | null
  resultRef: Record<string, unknown> | null
  costPoints: number | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** WS task.updated 原始载荷（task-updated-event.schema.json）。 */
export interface TaskUpdatedWsPayload {
  taskId: Id
  episodeId: Id
  taskType: TaskType
  status: TaskStatus
  progress: number
  result: Record<string, unknown> | null
  error: { code: string; message: string; retryable: boolean } | null
  updatedAt: IsoDateTime
}

export interface TaskUpdatedEvent {
  type: 'task.updated'
  data: GenerationTask
}

export const TERMINAL_TASK_STATUSES: readonly TaskStatus[] = [
  'succeeded',
  'failed',
  'canceled',
]

export function isTerminalStatus(status: TaskStatus): boolean {
  return TERMINAL_TASK_STATUSES.includes(status)
}

export function isCancelable(status: TaskStatus): boolean {
  return status === 'pending' || status === 'queued'
}

export function taskFromWsPayload(payload: TaskUpdatedWsPayload, projectId: Id): GenerationTask {
  return {
    id: payload.taskId,
    projectId,
    episodeId: payload.episodeId,
    shotId: null,
    panelId: null,
    taskType: payload.taskType,
    status: payload.status,
    attempt: 0,
    progress: payload.progress,
    errorCode: payload.error?.code ?? null,
    errorMessage: payload.error?.message ?? null,
    retryable: payload.error?.retryable ?? null,
    resultRef: payload.result,
    costPoints: null,
    createdAt: payload.updatedAt,
    updatedAt: payload.updatedAt,
  }
}
