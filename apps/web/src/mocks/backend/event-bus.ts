// 按 episode 分发任务事件的内存事件总线（mock 模式的“WebSocket 服务端”侧）。
import type { Id, TaskUpdatedEvent } from '@/api/types'

type Listener = (event: TaskUpdatedEvent) => void

export class MockEventBus {
  private readonly listeners = new Map<Id, Set<Listener>>()

  subscribe(episodeId: Id, listener: Listener): () => void {
    let set = this.listeners.get(episodeId)
    if (!set) {
      set = new Set()
      this.listeners.set(episodeId, set)
    }
    set.add(listener)
    return () => {
      set?.delete(listener)
      if (set && set.size === 0) this.listeners.delete(episodeId)
    }
  }

  /** 推送完整任务快照给该 episode 的全部订阅者。 */
  emit(episodeId: Id, event: TaskUpdatedEvent): void {
    this.listeners.get(episodeId)?.forEach((l) => l(event))
  }
}
