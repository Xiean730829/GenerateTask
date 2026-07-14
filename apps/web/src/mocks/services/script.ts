import type { ScriptService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { generateShots } from '@/mocks/backend/content'
import { clone, nowIso } from '@/mocks/backend/util'

export const mockScriptService: ScriptService = {
  async getByEpisode(episodeId) {
    const script = backend.db.getEpisodeState(episodeId).script
    return script ? clone(script) : null
  },

  async update(scriptId, input) {
    for (const state of backend.db.episodes.values()) {
      if (state.script?.id === scriptId) {
        state.script.content = input.content
        state.script.updatedAt = nowIso()
        return clone(state.script)
      }
    }
    throw new Error(`Script 不存在：${scriptId}`)
  },

  async confirmAndGenerateShots(scriptId) {
    for (const state of backend.db.episodes.values()) {
      if (state.script?.id !== scriptId) continue
      state.script.status = 'confirmed'
      state.script.confirmedAt = nowIso()
      state.script.updatedAt = nowIso()
      const episodeId = state.episode.id
      const task = backend.engine.start({
        episodeId,
        taskType: 'shot.generate',
        onSucceed: () => {
          const s = backend.db.getEpisodeState(episodeId)
          s.shots = generateShots(episodeId, scriptId)
          return { shotCount: s.shots.length }
        },
      })
      return { taskId: task.id }
    }
    throw new Error(`Script 不存在：${scriptId}`)
  },
}
