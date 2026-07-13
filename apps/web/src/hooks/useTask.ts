import type { GenerationTask, Id } from '@/api'
import { useWorkspaceSelector } from '@/stores/workspace-context'

/** 按 taskId 取当前任务快照（就地展示用）。 */
export function useTask(taskId: Id | null | undefined): GenerationTask | undefined {
  return useWorkspaceSelector((s) => (taskId ? s.tasks[taskId] : undefined))
}
