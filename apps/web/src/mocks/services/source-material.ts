import type { SourceMaterialService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { clone, nowIso } from '@/mocks/backend/util'

export const mockSourceMaterialService: SourceMaterialService = {
  async getByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).sourceMaterial)
  },
  async update(id, input) {
    for (const state of backend.db.episodes.values()) {
      if (state.sourceMaterial.id === id) {
        state.sourceMaterial.text = input.text
        state.sourceMaterial.updatedAt = nowIso()
        return clone(state.sourceMaterial)
      }
    }
    throw new Error(`SourceMaterial 不存在：${id}`)
  },
}
