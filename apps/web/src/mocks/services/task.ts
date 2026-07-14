import type { TaskService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { clone } from '@/mocks/backend/util'

export const mockTaskService: TaskService = {
  async listByEpisode(episodeId) {
    return backend.engine.listByEpisode(episodeId).map(clone)
  },

  async get(taskId) {
    const task = backend.engine.get(taskId)
    if (!task) throw new Error(`任务不存在：${taskId}`)
    return clone(task)
  },

  async cancel(taskId) {
    return clone(backend.engine.cancel(taskId))
  },

  async retry(taskId) {
    return clone(backend.engine.retry(taskId))
  },
}
