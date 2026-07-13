// 真实模式任务事件源：原生 JSON WebSocket，路径 /api/ws/episodes/{episodeId}。
// MS1 不做鉴权。断线自动重连；重连后由业务层调用任务查询接口校正。
import type {
  ConnectionListener,
  ConnectionState,
  EpisodeTaskEventSource,
  TaskEventListener,
} from '@/api/contracts'
import type { Id, TaskUpdatedEvent } from '@/api/types'

class HttpEpisodeSocket {
  private ws: WebSocket | null = null
  private closedByUs = false
  private reconnectDelay = 1000
  private readonly listeners = new Set<TaskEventListener>()
  private readonly connListeners = new Set<ConnectionListener>()

  constructor(
    private readonly url: string,
    private readonly onEmpty: () => void,
  ) {}

  addListener(l: TaskEventListener): void {
    this.listeners.add(l)
  }

  removeListener(l: TaskEventListener): void {
    this.listeners.delete(l)
    if (this.listeners.size === 0) this.teardown()
  }

  addConnListener(l: ConnectionListener): void {
    this.connListeners.add(l)
  }

  removeConnListener(l: ConnectionListener): void {
    this.connListeners.delete(l)
  }

  connect(): void {
    this.closedByUs = false
    this.setState('connecting')
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => {
      this.reconnectDelay = 1000
      this.setState('open')
    }
    ws.onmessage = (ev) => this.handleMessage(ev.data)
    ws.onclose = () => {
      this.setState('closed')
      if (!this.closedByUs) this.scheduleReconnect()
    }
    ws.onerror = () => ws.close()
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return
    try {
      const parsed = JSON.parse(raw) as TaskUpdatedEvent
      if (parsed?.type === 'task.updated') {
        this.listeners.forEach((l) => l(parsed))
      }
    } catch {
      // 忽略无法解析的帧。
    }
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectDelay
    this.reconnectDelay = Math.min(delay * 2, 15000)
    setTimeout(() => {
      if (!this.closedByUs && this.listeners.size > 0) this.connect()
    }, delay)
  }

  private setState(state: ConnectionState): void {
    this.connListeners.forEach((l) => l(state))
  }

  private teardown(): void {
    this.closedByUs = true
    this.ws?.close()
    this.ws = null
    this.onEmpty()
  }
}

export function createHttpEventSource(
  wsBaseUrl: string,
): EpisodeTaskEventSource {
  const sockets = new Map<Id, HttpEpisodeSocket>()

  const ensure = (episodeId: Id): HttpEpisodeSocket => {
    let sock = sockets.get(episodeId)
    if (!sock) {
      const url = `${wsBaseUrl}/episodes/${episodeId}`
      sock = new HttpEpisodeSocket(url, () => sockets.delete(episodeId))
      sockets.set(episodeId, sock)
      sock.connect()
    }
    return sock
  }

  return {
    subscribe(episodeId, listener) {
      const sock = ensure(episodeId)
      sock.addListener(listener)
      return () => sock.removeListener(listener)
    },
    onConnectionChange(episodeId, listener) {
      const sock = ensure(episodeId)
      sock.addConnListener(listener)
      return () => sock.removeConnListener(listener)
    },
  }
}
