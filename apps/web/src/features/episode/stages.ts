import type { StageKey, StageStatus } from '@/api'
import type { WorkspaceState } from '@/stores/workspace-types'

export interface StageDescriptor {
  key: StageKey
  label: string
}

/** 顶部常驻阶段导航顺序。 */
export const STAGES: StageDescriptor[] = [
  { key: 'input', label: '输入' },
  { key: 'script', label: '剧本' },
  { key: 'shot', label: '镜头工作台' },
  { key: 'panel', label: 'Panel 与视频' },
  { key: 'timeline', label: '时间线' },
  { key: 'export', label: '导出' },
]

/** 某阶段是否满足进入前置条件（不允许跳过前置启动后续阶段）。 */
export function isStageUnlocked(s: WorkspaceState, key: StageKey): boolean {
  switch (key) {
    case 'input':
    case 'script':
      return true
    case 'shot':
      return s.script?.status === 'confirmed'
    case 'panel':
      return allShotsHaveSelectedKeyframe(s)
    case 'timeline':
      return s.panelVideos.length > 0 && s.panelVideos.every((v) => v.status === 'ready')
    case 'export':
      return !!s.timeline && s.timeline.freshness === 'fresh'
  }
}

export function allShotsHaveSelectedKeyframe(s: WorkspaceState): boolean {
  if (s.shots.length === 0) return false
  return s.shots.every((shot) =>
    s.keyframes.some((k) => k.shotId === shot.id && k.selectedKeyframeId),
  )
}
