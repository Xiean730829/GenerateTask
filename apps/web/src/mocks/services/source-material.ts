import type { SourceMaterialService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { clone, nowIso } from '@/mocks/backend/util'

export const mockSourceMaterialService: SourceMaterialService = {
  async getByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).sourceMaterial)
  },

  async update(id, input) {
    for (const state of backend.db.episodes.values()) {
      if (state.sourceMaterial.id !== id) continue
      state.sourceMaterial.text = input.text
      if (input.title !== undefined) state.sourceMaterial.title = input.title
      return clone(state.sourceMaterial)
    }
    throw new Error(`材料不存在：${id}`)
  },
}
