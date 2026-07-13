import type { Id } from '@/api/types'
import type { TaskUpdatedEvent } from '@/api/types'

export type TaskEventListener = (event: TaskUpdatedEvent) => void

export type ConnectionState = 'connecting' | 'open' | 'closed'

export type ConnectionListener = (state: ConnectionState) => void

/**
 * Episode 范围任务事件源。
 * - 真实模式：原生 JSON WebSocket /api/ws/episodes/{episodeId}。
 * - Mock 模式：内存事件流。
 * 两种模式推送同一份完整任务快照（TaskUpdatedEvent）。
 */
export interface EpisodeTaskEventSource {
  /** 订阅某 episode 的任务事件；返回取消订阅函数。 */
  subscribe(episodeId: Id, listener: TaskEventListener): () => void
  /** 订阅连接状态（用于展示重连并触发校正）。 */
  onConnectionChange(episodeId: Id, listener: ConnectionListener): () => void
}
