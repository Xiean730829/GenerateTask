import { useEffect, useState } from 'react'
import type { ExportEstimate, ExportFormat, ExportOptions, Resolution } from '@/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { StageHeader } from '@/features/episode/StageHeader'
import { useTask } from '@/hooks/useTask'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'

/** 导出阶段：展示格式 / 画幅 / 清晰度与成本预估，确认后才创建 Export 任务。 */
export function ExportStage() {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const job = state.exportJob
  const task = useTask(job?.taskId)

  const [format, setFormat] = useState<ExportFormat>('mp4')
  const [resolution, setResolution] = useState<Resolution>('720p')
  const [estimate, setEstimate] = useState<ExportEstimate | null>(null)
  const [busy, setBusy] = useState(false)

  const options: ExportOptions = {
    format,
    resolution,
    aspectRatio: state.project?.aspectRatio ?? '9:16',
  }

  useEffect(() => {
    let active = true
    void store.estimateExport(options).then((e) => { if (active) setEstimate(e) })
    return () => { active = false }
  }, [format, resolution, state.project?.aspectRatio])

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
      <StageHeader title="导出" desc="确认导出参数与成本预估后创建导出任务。" />
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
            <input value={options.aspectRatio} disabled />
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
        {estimate && (
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">预计时长 {estimate.durationSec}s</span>
            <strong>成本预估：{estimate.estimatedCost} {estimate.currency}</strong>
          </div>
        )}
        <TaskStatusInline task={task} />
        {job?.status === 'ready' ? (
          <div className="row">
            <Badge tone="done">导出完成</Badge>
            <span className="muted" style={{ fontSize: '0.82rem' }}>{job.downloadUrl}</span>
          </div>
        ) : (
          <Button variant="primary" disabled={busy || job?.status === 'rendering'} onClick={() => void create()}>
            确认导出
          </Button>
        )}
      </div>
    </section>
  )
}
