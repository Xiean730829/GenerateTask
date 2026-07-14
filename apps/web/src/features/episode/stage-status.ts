import type { StageKey, StageStatus, TaskType } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { isPanelVideoReady } from '@/api/types/panel'
import { isTimelineFresh } from '@/api/types/timeline'
import type { WorkspaceState } from '@/stores/workspace-types'
import { isStageUnlocked } from './stages'

const STAGE_TASK_TYPES: Partial<Record<StageKey, TaskType>> = {
  script: 'script.generate',
  shot: 'shot.generate',
  panel: 'video.generate',
  timeline: 'audio.subtitle',
  export: 'export.compose',
}

function hasActiveTask(s: WorkspaceState, type: TaskType): boolean {
  return Object.values(s.tasks).some(
    (t) => t.taskType === type && ['pending', 'queued', 'running', 'retrying'].includes(t.status),
  )
}

function hasFailedTask(s: WorkspaceState, type: TaskType): boolean {
  return Object.values(s.tasks).some((t) => t.taskType === type && t.status === 'failed')
}

export function deriveStageStatus(s: WorkspaceState, key: StageKey): StageStatus {
  const taskType = STAGE_TASK_TYPES[key]
  if (taskType && hasActiveTask(s, taskType)) return 'active'
  if (taskType && hasFailedTask(s, taskType) && !isStageDone(s, key)) return 'failed'
  if (!isStageUnlocked(s, key) && !isStageDone(s, key)) return 'pending'
  if (isStageStale(s, key)) return 'stale'
  if (isStageDone(s, key)) return 'done'
  return 'active'
}

function isStageDone(s: WorkspaceState, key: StageKey): boolean {
  const keyframesByShot = groupKeyframesByShot(s.keyframes)
  switch (key) {
    case 'input':
      return !!s.sourceMaterial
    case 'script':
      return s.script?.status === 'confirmed'
    case 'shot':
      return s.shots.length > 0 && s.shots.every((shot) =>
        keyframesByShot.some((k) => k.shotId === shot.id && k.selectedKeyframeId))
    case 'panel':
      return s.panelVideos.length > 0 && s.panelVideos.every(isPanelVideoReady)
    case 'timeline':
      return isTimelineFresh(s.timeline)
    case 'export':
      return s.exportRecord?.status === 'succeeded'
  }
}

function isStageStale(s: WorkspaceState, key: StageKey): boolean {
  if (key === 'panel') return s.panelVideos.some((v) => v.status === 'stale')
  if (key === 'timeline') return !!s.timeline && s.timeline.status === 'stale'
  return false
}

export { isStageUnlocked }
