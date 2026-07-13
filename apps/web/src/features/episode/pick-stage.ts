import type { StageKey } from '@/api'
import type { WorkspaceState } from '@/stores/workspace-types'
import { STAGES, isStageUnlocked } from './stages'

/** 首次进入时定位到最靠后的、已解锁且尚未完成的阶段。 */
export function pickInitialStage(s: WorkspaceState): StageKey {
  let candidate: StageKey = 'input'
  for (const { key } of STAGES) {
    if (isStageUnlocked(s, key)) candidate = key
    else break
  }
  return candidate
}
