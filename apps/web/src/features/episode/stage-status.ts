import type { StageKey, StageStatus, TaskType } from '@/api'
import type { WorkspaceState } from '@/stores/workspace-types'
import { isStageUnlocked } from './stages'

const STAGE_TASK_TYPES: Partial<Record<StageKey, TaskType>> = {
  script: 'script.generate',
  shot: 'shot.generate',
  panel: 'panel.assemble',
  timeline: 'timeline.compose',
  export: 'export.render',
}

function hasActiveTask(s: WorkspaceState, type: TaskType): boolean {
  return Object.values(s.tasks).some(
    (t) => t.taskType === type && ['pending', 'queued', 'running', 'retrying'].includes(t.status),
  )
}

function hasFailedTask(s: WorkspaceState, type: TaskType): boolean {
  return Object.values(s.tasks).some((t) => t.taskType === type && t.status === 'failed')
}

/** 推导单个阶段在导航中的展示状态。 */
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
  switch (key) {
    case 'input':
      return !!s.sourceMaterial
    case 'script':
      return s.script?.status === 'confirmed'
    case 'shot':
      return s.shots.length > 0 && s.shots.every((shot) =>
        s.keyframes.some((k) => k.shotId === shot.id && k.selectedKeyframeId))
    case 'panel':
      return s.panelVideos.length > 0 && s.panelVideos.every((v) => v.status === 'ready')
    case 'timeline':
      return !!s.timeline && s.timeline.freshness === 'fresh'
    case 'export':
      return s.exportJob?.status === 'ready'
  }
}

function isStageStale(s: WorkspaceState, key: StageKey): boolean {
  if (key === 'panel') return s.panelVideos.some((v) => v.status === 'stale')
  if (key === 'timeline') return !!s.timeline && s.timeline.freshness === 'stale'
  return false
}

export { isStageUnlocked }
