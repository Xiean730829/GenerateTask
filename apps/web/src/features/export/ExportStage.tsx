import { useState } from 'react'
import type { AspectRatio, ExportFormat, ExportOptions, Resolution } from '@/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { StageHeader } from '@/features/episode/StageHeader'
import { useTask } from '@/hooks/useTask'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'

export function ExportStage() {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const record = state.exportRecord
  const task = useTask(record?.taskId)

  const [format, setFormat] = useState<ExportFormat>('mp4')
  const [resolution, setResolution] = useState<Resolution>('720p')
  const [busy, setBusy] = useState(false)

  const aspectRatio = (state.project?.aspectRatio ?? '9:16') as AspectRatio
  const options: ExportOptions = { format, resolution, aspectRatio }

  const create = async () => {
    setBusy(true)
    try {
      await store.createExport(options)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <StageHeader title="导出" desc="确认导出参数后创建 export.compose 任务。" />
      <div className="card stack" style={{ maxWidth: 520 }}>
        <div className="grid-3">
          <label className="stack" style={{ gap: '0.3rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>格式</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
            </select>
          </label>
          <label className="stack" style={{ gap: '0.3rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>画幅</span>
            <input value={aspectRatio} disabled />
          </label>
          <label className="stack" style={{ gap: '0.3rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>清晰度</span>
            <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)}>
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </label>
        </div>
        <TaskStatusInline task={task} />
        {record?.status === 'succeeded' ? (
          <div className="row">
            <Badge tone="done">导出完成</Badge>
            <span className="muted" style={{ fontSize: '0.82rem' }}>{record.fileUrl}</span>
          </div>
        ) : (
          <Button variant="primary" disabled={busy || record?.status === 'running'} onClick={() => void create()}>
            确认导出
          </Button>
        )}
      </div>
    </section>
  )
}
