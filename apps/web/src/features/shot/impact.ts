import type { Id } from '@/api'
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
    (v) => panelIds.has(v.panelId) && v.status === 'ready',
  ).length
  return {
    affectedPanelVideos,
    timelineAffected: !!s.timeline && s.timeline.freshness === 'fresh' && affectedPanelVideos > 0,
  }
}
