import type { GenerationTask, TaskStatus } from '@/api'
import { isCancelable } from '@/api'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useWorkspaceStore } from '@/stores/workspace-context'

const LABELS: Record<TaskStatus, string> = {
  pending: '排队前',
  queued: '已入队',
  running: '生成中',
  succeeded: '已完成',
  failed: '失败',
  retrying: '重试中',
  canceled: '已取消',
}

const TONES: Record<TaskStatus, BadgeTone> = {
  pending: 'pending',
  queued: 'pending',
  running: 'active',
  succeeded: 'done',
  failed: 'failed',
  retrying: 'active',
  canceled: 'pending',
}

/**
 * 就地任务状态：状态徽标、进度、错误摘要与可用操作（取消 / 重试）。
 * 可重试性以服务端 error.retryable 为准；仅 pending / queued 可取消。
 */
export function TaskStatusInline({ task }: { task: GenerationTask | undefined }) {
  const store = useWorkspaceStore()
  if (!task) return null

  const running = task.status === 'running' || task.status === 'retrying' || task.status === 'queued'

  return (
    <div className="stack" style={{ gap: '0.4rem' }}>
      <div className="row">
        <Badge tone={TONES[task.status]}>{LABELS[task.status]}</Badge>
        {running && <span className="muted" style={{ fontSize: '0.8rem' }}>{task.progress}%</span>}
        {isCancelable(task.status) && (
          <Button size="sm" variant="ghost" onClick={() => void store.cancelTask(task.taskId)}>
            取消
          </Button>
        )}
        {task.status === 'failed' && task.error?.retryable && (
          <Button size="sm" onClick={() => void store.retryTask(task.taskId)}>
            重试
          </Button>
        )}
      </div>
      {running && <ProgressBar value={task.progress} />}
      {task.status === 'failed' && task.error && (
        <div className="inline-error">
          [{task.error.code}] {task.error.message}
          {!task.error.retryable && <span className="muted">（该错误不可重试）</span>}
        </div>
      )}
    </div>
  )
}
