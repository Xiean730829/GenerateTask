import type { Id } from '@/api'
import { isPanelVideoReady } from '@/api/types/panel'
import { isTimelineFresh } from '@/api/types/timeline'
import type { WorkspaceState } from '@/stores/workspace-types'

/**
 * 从已加载状态推导某 Shot 改动的下游影响（用于保存前提示）。
 * 仅读取现有 Panel / 视频 / Timeline，不做任何分组计算。
 */
export function shotDownstreamImpact(s: WorkspaceState, shotId: Id): {
  affectedPanelVideos: number
  timelineAffected: boolean
} {
  const panelIds = new Set(
    s.panels.filter((p) => p.shotIds.includes(shotId)).map((p) => p.id),
  )
  const affectedPanelVideos = s.panelVideos.filter(
    (v) => panelIds.has(v.panelId) && isPanelVideoReady(v),
  ).length
  return {
    affectedPanelVideos,
    timelineAffected: isTimelineFresh(s.timeline) && affectedPanelVideos > 0,
  }
}
