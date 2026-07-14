import type { KeyframeService } from '@/api/contracts'
import type { Id, Keyframe } from '@/api/types'
import { backend } from '@/mocks/backend'
import { generateKeyframes, mediaUrlFor } from '@/mocks/backend/content'
import { clone } from '@/mocks/backend/util'

export const mockKeyframeService: KeyframeService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).keyframes)
  },

  async generateNextBatch(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const shotIds = state.shots
      .filter((shot) => !state.keyframes.some((kf) => kf.shotId === shot.id && kf.status === 'selected'))
      .map((s) => s.id)
    const task = backend.engine.start({
      episodeId,
      taskType: 'keyframe.generate',
      onSucceed: () => {
        const s = backend.db.getEpisodeState(episodeId)
        for (const [i, shotId] of shotIds.entries()) {
          const created = generateKeyframes(shotId, i + 10)
          for (const kf of created) {
            backend.db.mediaUrls.set(kf.mediaFileId, mediaUrlFor(kf.mediaFileId, i))
            s.keyframes.push(kf)
          }
        }
        return { shotIds }
      },
    })
    return { taskId: task.id, shotIds }
  },

  async regenerate(shotId) {
    const { episodeId } = findShot(shotId)
    const task = backend.engine.start({
      episodeId,
      taskType: 'keyframe.generate',
      onSucceed: () => {
        const s = backend.db.getEpisodeState(episodeId)
        s.keyframes = s.keyframes.filter((kf) => kf.shotId !== shotId)
        const created = generateKeyframes(shotId, 99)
        for (const kf of created) {
          backend.db.mediaUrls.set(kf.mediaFileId, mediaUrlFor(kf.mediaFileId, 99))
          s.keyframes.push(kf)
        }
        return { shotId }
      },
    })
    return { taskId: task.id }
  },

  async select(keyframeId) {
    let selected: Keyframe | undefined
    for (const state of backend.db.episodes.values()) {
      const target = state.keyframes.find((kf) => kf.id === keyframeId)
      if (!target) continue
      for (const kf of state.keyframes) {
        if (kf.shotId === target.shotId) {
          kf.status = kf.id === keyframeId ? 'selected' : 'rejected'
        }
      }
      selected = state.keyframes.find((kf) => kf.id === keyframeId)
      if (selected) return clone(selected)
    }
    throw new Error(`关键帧不存在：${keyframeId}`)
  },
}

function findShot(shotId: Id): { episodeId: Id } {
  for (const state of backend.db.episodes.values()) {
    if (state.shots.some((s) => s.id === shotId)) return { episodeId: state.episode.id }
  }
  throw new Error(`镜头不存在：${shotId}`)
}
