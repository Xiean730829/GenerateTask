import type { Id, KeyframesByShot } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { useWorkspaceSelector } from '@/stores/workspace-context'

export function useKeyframesByShot(shotId: Id): KeyframesByShot | undefined {
  return useWorkspaceSelector((s) =>
    groupKeyframesByShot(s.keyframes).find((entry) => entry.shotId === shotId),
  )
}

export function useAllKeyframesByShot(): KeyframesByShot[] {
  return useWorkspaceSelector((s) => groupKeyframesByShot(s.keyframes))
}
