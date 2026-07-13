// Mock 任务事件源：内存事件流，接口与真实 WebSocket 完全一致。
import type {
  ConnectionListener,
  EpisodeTaskEventSource,
  TaskEventListener,
} from '@/api/contracts'
import { backend } from '@/mocks/backend'

export const mockEpisodeTaskEventSource: EpisodeTaskEventSource = {
  subscribe(episodeId, listener: TaskEventListener) {
    return backend.bus.subscribe(episodeId, listener)
  },
  onConnectionChange(_episodeId, listener: ConnectionListener) {
    // Mock 连接始终可用；异步通知“open”以贴近真实连接生命周期。
    const timer = setTimeout(() => listener('open'), 0)
    return () => clearTimeout(timer)
  },
}
