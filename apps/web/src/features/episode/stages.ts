import type { StageKey } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { isPanelVideoReady } from '@/api/types/panel'
import { isTimelineFresh } from '@/api/types/timeline'
import type { WorkspaceState } from '@/stores/workspace-types'

export interface StageDescriptor {
  key: StageKey
  label: string
}

export const STAGES: StageDescriptor[] = [
  { key: 'input', label: '输入' },
  { key: 'script', label: '剧本' },
  { key: 'shot', label: '镜头工作台' },
  { key: 'panel', label: 'Panel 与视频' },
  { key: 'timeline', label: '时间线' },
  { key: 'export', label: '导出' },
]

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
      return s.panelVideos.length > 0 && s.panelVideos.every(isPanelVideoReady)
    case 'export':
      return isTimelineFresh(s.timeline)
  }
}

export function allShotsHaveSelectedKeyframe(s: WorkspaceState): boolean {
  if (s.shots.length === 0) return false
  const grouped = groupKeyframesByShot(s.keyframes)
  return s.shots.every((shot) =>
    grouped.some((k) => k.shotId === shot.id && k.selectedKeyframeId),
  )
}
