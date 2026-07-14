// 上游改动的下游失效级联。
import type { EpisodeState } from '@/mocks/backend'
import type { Id } from '@/api/types'
import { isPanelVideoReady } from '@/api/types/panel'
import { nowIso } from '@/mocks/backend/util'

export function impactOfShot(state: EpisodeState, shotId: Id): {
  panelCount: number
  timelineAffected: boolean
} {
  const panels = state.panels.filter((p) => p.shotIds.includes(shotId))
  const affectedPanelVideos = state.panelVideos.filter(
    (v) => panels.some((p) => p.id === v.panelId) && isPanelVideoReady(v),
  )
  return {
    panelCount: affectedPanelVideos.length,
    timelineAffected: !!state.timeline && state.timeline.status !== 'stale' && affectedPanelVideos.length > 0,
  }
}

export function invalidateForShot(state: EpisodeState, shotId: Id): void {
  const affectedPanelIds = new Set(
    state.panels.filter((p) => p.shotIds.includes(shotId)).map((p) => p.id),
  )
  let anyReadyInvalidated = false
  for (const video of state.panelVideos) {
    if (!affectedPanelIds.has(video.panelId)) continue
    if (isPanelVideoReady(video)) {
      video.status = 'stale'
      anyReadyInvalidated = true
    }
  }
  if (anyReadyInvalidated && state.timeline) {
    state.timeline.status = 'stale'
    state.timeline.updatedAt = nowIso()
  }
}
