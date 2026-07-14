import type { PanelService } from '@/api/contracts'
import type { PanelVideo } from '@/api/types'
import { backend } from '@/mocks/backend'
import { assembleGreedy } from '@/mocks/backend/assembly'
import { clone, mockId, nowIso } from '@/mocks/backend/util'

export const mockPanelService: PanelService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).panels)
  },

  async assemble(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const { panels, revisions } = assembleGreedy(
      episodeId,
      state.shots,
      state.keyframes,
      backend.db.videoCapability.maxPanelDurationSeconds,
    )
    state.panels = panels
    state.panelRevisions = revisions
    const ts = nowIso()
    state.panelVideos = panels.flatMap<PanelVideo>((panel) => {
      if (!panel.currentRevisionId) return []
      return [{
        id: mockId('pvid'),
        panelId: panel.id,
        panelRevisionId: panel.currentRevisionId,
        status: 'pending',
        taskId: null,
        mediaFileId: null,
        createdAt: ts,
        videoUrl: null,
      }]
    })
    if (state.timeline) {
      state.timeline.status = 'stale'
      state.timeline.updatedAt = ts
    }
    return clone(panels)
  },
}
