import type { ShotService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { clone, nowIso } from '@/mocks/backend/util'
import { invalidateForShot } from './invalidation'

export const mockShotService: ShotService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).shots)
  },

  async update(shotId, input) {
    for (const state of backend.db.episodes.values()) {
      const shot = state.shots.find((s) => s.id === shotId)
      if (!shot) continue
      Object.assign(shot, input)
      invalidateForShot(state, shotId)
      return clone(shot)
    }
    throw new Error(`镜头不存在：${shotId}`)
  },
}
