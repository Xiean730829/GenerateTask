import type { PanelVideoService } from '@/api/contracts'
import type { FailurePolicy } from '@/mocks/backend/task-engine'
import type { EpisodeState } from '@/mocks/backend'
import type { Id } from '@/api/types'
import { backend } from '@/mocks/backend'
import { placeholderVideoPoster } from '@/mocks/backend/content'
import { clone, nowIso } from '@/mocks/backend/util'

function findPanelEpisode(panelId: Id): Id {
  for (const state of backend.db.episodes.values()) {
    if (state.panels.some((p) => p.id === panelId)) return state.episode.id
  }
  throw new Error(`Panel 不存在：${panelId}`)
}

/** 每个 Episode 首个生成的 Panel 视频演示一次可重试失败，重试后成功。 */
function demoFailure(state: EpisodeState): FailurePolicy | undefined {
  if (state.failedOnce.has('panel-video-demo')) return undefined
  state.failedOnce.add('panel-video-demo')
  return (attempt) =>
    attempt === 1
      ? {
          code: 'VIDEO_PROVIDER_TIMEOUT',
          message: '视频服务响应超时，可重试。',
          retryable: true,
        }
      : null
}

function startVideoTask(state: EpisodeState, panelId: Id, order: number): Id {
  const episodeId = state.episode.id
  const video = state.panelVideos.find((v) => v.panelId === panelId)
  if (!video) throw new Error(`Panel 视频记录不存在：${panelId}`)
  video.status = 'generating'
  video.updatedAt = nowIso()
  const task = backend.engine.start({
    episodeId,
    taskType: 'panel-video.generate',
    failure: demoFailure(state),
    onSucceed: () => {
      const s = backend.db.getEpisodeState(episodeId)
      const v = s.panelVideos.find((x) => x.panelId === panelId)
      if (v) {
        v.status = 'ready'
        v.freshness = 'fresh'
        v.videoUrl = placeholderVideoPoster(`Panel ${order}`)
        v.updatedAt = nowIso()
      }
      return { panelId }
    },
    onFail: () => {
      const s = backend.db.getEpisodeState(episodeId)
      const v = s.panelVideos.find((x) => x.panelId === panelId)
      if (v) {
        v.status = 'failed'
        v.updatedAt = nowIso()
      }
    },
  })
  video.taskId = task.taskId
  return task.taskId
}

export const mockPanelVideoService: PanelVideoService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).panelVideos)
  },

  async generate(panelId) {
    const episodeId = findPanelEpisode(panelId)
    const state = backend.db.getEpisodeState(episodeId)
    const panel = state.panels.find((p) => p.id === panelId)
    const taskId = startVideoTask(state, panelId, panel?.order ?? 0)
    return { taskId }
  },

  async generateBatch(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const taskIds: Id[] = []
    for (const panel of state.panels) {
      const video = state.panelVideos.find((v) => v.panelId === panel.id)
      // 批量仅处理未生成、失败或失效的 Panel；已成功且未失效的跳过。
      if (!video || video.status === 'ready') continue
      taskIds.push(startVideoTask(state, panel.id, panel.order))
    }
    return { taskIds }
  },
}
