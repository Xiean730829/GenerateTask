import type { PanelVideoService } from '@/api/contracts'
import type { FailurePolicy } from '@/mocks/backend/task-engine'
import type { EpisodeState } from '@/mocks/backend'
import type { Id } from '@/api/types'
import { backend } from '@/mocks/backend'
import { placeholderVideoPoster } from '@/mocks/backend/content'
import { clone, mockId } from '@/mocks/backend/util'

function findPanelEpisode(panelId: Id): Id {
  for (const state of backend.db.episodes.values()) {
    if (state.panels.some((p) => p.id === panelId)) return state.episode.id
  }
  throw new Error(`Panel 不存在：${panelId}`)
}

function demoFailure(state: EpisodeState): FailurePolicy | undefined {
  if (state.failedOnce.has('panel-video-demo')) return undefined
  state.failedOnce.add('panel-video-demo')
  return (attempt) =>
    attempt === 1
      ? { code: 'VIDEO_PROVIDER_TIMEOUT', message: '视频服务响应超时，可重试。', retryable: true }
      : null
}

function startVideoTask(state: EpisodeState, panelId: Id, orderIndex: number): Id {
  const episodeId = state.episode.id
  const video = state.panelVideos.find((v) => v.panelId === panelId)
  if (!video) throw new Error(`Panel 视频记录不存在：${panelId}`)
  video.status = 'running'
  const task = backend.engine.start({
    episodeId,
    taskType: 'video.generate',
    failure: demoFailure(state),
    onSucceed: () => {
      const s = backend.db.getEpisodeState(episodeId)
      const v = s.panelVideos.find((x) => x.panelId === panelId)
      if (v) {
        v.status = 'succeeded'
        v.mediaFileId = mockId('media')
        v.videoUrl = placeholderVideoPoster(`Panel ${orderIndex + 1}`)
      }
      return { panelId }
    },
    onFail: () => {
      const s = backend.db.getEpisodeState(episodeId)
      const v = s.panelVideos.find((x) => x.panelId === panelId)
      if (v) v.status = 'failed'
    },
  })
  video.taskId = task.id
  return task.id
}

export const mockPanelVideoService: PanelVideoService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).panelVideos)
  },

  async generate(panelId) {
    const episodeId = findPanelEpisode(panelId)
    const state = backend.db.getEpisodeState(episodeId)
    const panel = state.panels.find((p) => p.id === panelId)
    const taskId = startVideoTask(state, panelId, panel?.orderIndex ?? 0)
    return { taskId }
  },

  async generateBatch(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const taskIds: Id[] = []
    for (const panel of state.panels) {
      const video = state.panelVideos.find((v) => v.panelId === panel.id)
      if (!video || video.status === 'succeeded') continue
      taskIds.push(startVideoTask(state, panel.id, panel.orderIndex))
    }
    return { taskIds }
  },
}
