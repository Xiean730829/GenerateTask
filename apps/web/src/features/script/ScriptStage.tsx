import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { StageHeader } from '@/features/episode/StageHeader'
import { useTask } from '@/hooks/useTask'
import { useWorkspaceSelector, useWorkspaceStore } from '@/stores/workspace-context'

/** 剧本阶段：就地展示生成状态，成功后可编辑；确认后才创建镜头任务。 */
export function ScriptStage({ onNext }: { onNext: () => void }) {
  const store = useWorkspaceStore()
  const script = useWorkspaceSelector((s) => s.script)
  const task = useTask(script?.taskId)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (script && script.status !== 'generating') setContent(script.content)
  }, [script?.id, script?.status, script?.updatedAt])

  const generating = script?.status === 'generating' || task?.status === 'running'
  const confirmed = script?.status === 'confirmed'
  const dirty = script ? content !== script.content : false

  const confirm = async () => {
    setBusy(true)
    try {
      if (dirty) await store.saveScript(content)
      await store.confirmScript()
      onNext()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <StageHeader
        title="剧本"
        desc="AI 生成剧本，可直接编辑；确认后进入镜头拆分。系统不会在剧本成功后自动继续。"
        actions={confirmed && <Badge tone="done">已确认</Badge>}
      />
      <div className="card stack">
        <TaskStatusInline task={task} />
        {generating ? (
          <p className="muted">正在生成剧本…</p>
        ) : (
          <>
            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={confirmed}
            />
            <div className="row">
              {!confirmed && (
                <>
                  <Button
                    variant="ghost"
                    disabled={!dirty || busy}
                    onClick={() => void store.saveScript(content)}
                  >
                    保存草稿
                  </Button>
                  <Button variant="primary" disabled={busy || !script} onClick={() => void confirm()}>
                    确认剧本并生成镜头
                  </Button>
                </>
              )}
              {confirmed && (
                <Button variant="primary" onClick={onNext}>前往镜头阶段 →</Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
