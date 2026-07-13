import type { GenerationTask, TaskType } from '@/api'
import { useWorkspaceSelector } from '@/stores/workspace-context'

/** 取某类型最近更新的任务，用于阶段级（非单对象）状态展示。 */
export function useLatestTaskByType(type: TaskType): GenerationTask | undefined {
  return useWorkspaceSelector((s) => {
    let latest: GenerationTask | undefined
    for (const t of Object.values(s.tasks)) {
      if (t.taskType !== type) continue
      if (!latest || t.updatedAt > latest.updatedAt) latest = t
    }
    return latest
  })
}
