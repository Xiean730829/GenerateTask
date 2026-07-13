// 上游改动的下游失效级联（后端语义）：Shot / 关键帧改动 → 所属 Panel 视频失效 → Timeline 失效。
import type { EpisodeState } from '@/mocks/backend'
import type { Id } from '@/api/types'
import { nowIso } from '@/mocks/backend/util'

/** 计算某 Shot 改动会影响的 Panel 数量，用于保存前的失效提示。 */
export function impactOfShot(state: EpisodeState, shotId: Id): {
  panelCount: number
  timelineAffected: boolean
} {
  const panels = state.panels.filter((p) => p.shotIds.includes(shotId))
  const affectedPanelVideos = state.panelVideos.filter(
    (v) => panels.some((p) => p.id === v.panelId) && v.status === 'ready',
  )
  return {
    panelCount: affectedPanelVideos.length,
    timelineAffected: !!state.timeline && affectedPanelVideos.length > 0,
  }
}

/** 执行失效：把含该 Shot 的 Panel 视频标记 stale，并使 Timeline 失效。 */
export function invalidateForShot(state: EpisodeState, shotId: Id): void {
  const affectedPanelIds = new Set(
    state.panels.filter((p) => p.shotIds.includes(shotId)).map((p) => p.id),
  )
  let anyReadyInvalidated = false
  for (const video of state.panelVideos) {
    if (!affectedPanelIds.has(video.panelId)) continue
    if (video.status === 'ready') {
      video.status = 'stale'
      video.freshness = 'stale'
      video.updatedAt = nowIso()
      anyReadyInvalidated = true
    }
  }
  if (anyReadyInvalidated && state.timeline) {
    state.timeline.freshness = 'stale'
    state.timeline.updatedAt = nowIso()
  }
}
