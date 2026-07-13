import type { ShotService } from '@/api/contracts'
import type { Id } from '@/api/types'
import { backend } from '@/mocks/backend'
import { clone, nowIso } from '@/mocks/backend/util'
import { invalidateForShot } from './invalidation'

function findShotState(shotId: Id) {
  for (const state of backend.db.episodes.values()) {
    const shot = state.shots.find((s) => s.id === shotId)
    if (shot) return { state, shot }
  }
  throw new Error(`Shot 不存在：${shotId}`)
}

export const mockShotService: ShotService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).shots)
  },

  async update(shotId, input) {
    const { state, shot } = findShotState(shotId)
    Object.assign(shot, input)
    shot.updatedAt = nowIso()
    // 保存后级联下游失效（Panel 视频 / Timeline）。
    invalidateForShot(state, shotId)
    return clone(shot)
  },

}
