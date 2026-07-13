import type { TaskService } from '@/api/contracts'
import { backend } from '@/mocks/backend'

export const mockTaskService: TaskService = {
  async listByEpisode(episodeId) {
    // 连接 / 重连后用于校正客户端状态。
    return backend.engine.listByEpisode(episodeId)
  },
  async get(taskId) {
    const task = backend.engine.get(taskId)
    if (!task) throw new Error(`任务不存在：${taskId}`)
    return task
  },
  async cancel(taskId) {
    return backend.engine.cancel(taskId)
  },
  async retry(taskId) {
    return backend.engine.retry(taskId)
  },
}
