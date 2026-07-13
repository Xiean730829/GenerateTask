import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { StageHeader } from '@/features/episode/StageHeader'
import { useTask } from '@/hooks/useTask'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'

/** 时间线阶段：所有 Panel 视频有效后显式合成；只读预览，不在此直接编辑内容。 */
export function TimelineStage({ onNext }: { onNext: () => void }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const timeline = state.timeline
  const task = useTask(timeline?.taskId)
  const [busy, setBusy] = useState(false)

  const allReady = state.panelVideos.length > 0 && state.panelVideos.every((v) => v.status === 'ready')
  const isStale = timeline?.freshness === 'stale'

  const compose = async () => {
    setBusy(true)
    try {
      await store.composeTimeline()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <StageHeader
        title="时间线"
        desc="只读交付预览：Panel 顺序、视频、音频轨与字幕轨。修改内容需回到镜头或 Panel 后重新合成。"
        actions={
          <>
            <Button disabled={busy || !allReady} onClick={() => void compose()}>
              {timeline ? '重新合成' : '生成时间线'}
            </Button>
            <Button variant="primary" disabled={!timeline || isStale} onClick={onNext}>
              前往导出 →
            </Button>
          </>
        }
      />
      {!allReady && <p className="muted">需所有 Panel 视频有效后才能合成时间线。</p>}
      {isStale && (
        <div className="inline-error" style={{ marginBottom: '0.75rem' }}>
          上游改动使时间线失效，请重新合成。
        </div>
      )}
      <TaskStatusInline task={task} />
      {timeline && (
        <div className="stack" style={{ marginTop: '0.75rem' }}>
          <div className="row">
            <Badge tone={isStale ? 'stale' : 'done'}>{isStale ? '已失效' : '有效'}</Badge>
            <span className="muted" style={{ fontSize: '0.85rem' }}>总时长 {timeline.totalDurationSec}s</span>
          </div>
          <TrackRow label="视频">
            {timeline.clips.map((c) => (
              <div key={c.panelId} className="badge" style={{ minWidth: 90, justifyContent: 'center' }}>
                Panel {c.order} · {c.durationSec}s
              </div>
            ))}
          </TrackRow>
          <TrackRow label="音频">
            <div className="badge">配音轨（{timeline.audioUrl ? '已生成' : '无'}）</div>
          </TrackRow>
          <TrackRow label="字幕">
            {timeline.subtitles.length === 0 ? (
              <span className="muted" style={{ fontSize: '0.82rem' }}>无字幕</span>
            ) : (
              timeline.subtitles.map((s, i) => (
                <span key={i} className="badge">{s.startSec}s：{s.text}</span>
              ))
            )}
          </TrackRow>
        </div>
      )}
    </section>
  )
}

function TrackRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <span className="muted" style={{ width: 48, fontSize: '0.82rem' }}>{label}</span>
      <div className="row" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
