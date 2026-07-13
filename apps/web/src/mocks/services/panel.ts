import type { PanelService } from '@/api/contracts'
import type { PanelVideo } from '@/api/types'
import { backend } from '@/mocks/backend'
import { assembleGreedy } from '@/mocks/backend/assembly'
import { clone, nowIso } from '@/mocks/backend/util'

export const mockPanelService: PanelService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).panels)
  },

  async assemble(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    // 后端贪心组装：读取视频 API 最大时长上限，保持 Shot 原顺序。前端不参与分组。
    const panels = assembleGreedy(
      episodeId,
      state.shots,
      state.keyframes,
      backend.db.videoCapability.maxClipDurationSec,
    )
    state.panels = panels
    // 组装（或重新组装）后重置视频状态为“未生成”。
    const ts = nowIso()
    state.panelVideos = panels.map<PanelVideo>((p) => ({
      panelId: p.id,
      status: 'none',
      freshness: 'fresh',
      videoUrl: null,
      taskId: null,
      updatedAt: ts,
    }))
    // 组装变更使既有 Timeline 失效。
    if (state.timeline) {
      state.timeline.freshness = 'stale'
      state.timeline.updatedAt = ts
    }
    return clone(panels)
  },
}
