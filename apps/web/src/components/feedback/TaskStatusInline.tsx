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
          <Button size="sm" variant="ghost" onClick={() => void store.cancelTask(task.id)}>
            取消
          </Button>
        )}
        {task.status === 'failed' && task.retryable && (
          <Button size="sm" onClick={() => void store.retryTask(task.id)}>
            重试
          </Button>
        )}
      </div>
      {running && <ProgressBar value={task.progress} />}
      {task.status === 'failed' && task.errorMessage && (
        <div className="inline-error">
          [{task.errorCode}] {task.errorMessage}
          {!task.retryable && <span className="muted">（该错误不可重试）</span>}
        </div>
      )}
    </div>
  )
}
