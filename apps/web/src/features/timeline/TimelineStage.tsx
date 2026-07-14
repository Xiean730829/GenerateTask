import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { StageHeader } from '@/features/episode/StageHeader'
import { isPanelVideoReady } from '@/api/types/panel'
import { isTimelineFresh } from '@/api/types/timeline'
import { useLatestTaskByType } from '@/hooks/useLatestTaskByType'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'

function totalDurationSeconds(timeline: NonNullable<ReturnType<typeof useWorkspaceState>['timeline']>): number {
  return timeline.videoTrack.reduce((sum, clip) => sum + clip.durationSeconds, 0)
}

/** 时间线阶段：Panel 视频就绪后触发 audio.subtitle，成功后同步 compose；只读预览。 */
export function TimelineStage({ onNext }: { onNext: () => void }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const timeline = state.timeline
  const audioTask = useLatestTaskByType('audio.subtitle')
  const [busy, setBusy] = useState(false)

  const allReady = state.panelVideos.length > 0 && state.panelVideos.every(isPanelVideoReady)
  const isStale = timeline?.status === 'stale'
  const audioBusy = audioTask && ['pending', 'queued', 'running', 'retrying'].includes(audioTask.status)

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
            <Button disabled={busy || audioBusy || !allReady} onClick={() => void compose()}>
              {timeline ? '重新合成' : '生成时间线'}
            </Button>
            <Button variant="primary" disabled={!isTimelineFresh(timeline)} onClick={onNext}>
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
      <TaskStatusInline task={audioTask} />
      {timeline && (
        <div className="stack" style={{ marginTop: '0.75rem' }}>
          <div className="row">
            <Badge tone={isStale ? 'stale' : 'done'}>{isStale ? '已失效' : '有效'}</Badge>
            <span className="muted" style={{ fontSize: '0.85rem' }}>总时长 {totalDurationSeconds(timeline)}s</span>
          </div>
          <TrackRow label="视频">
            {timeline.videoTrack.map((c) => (
              <div key={c.panelId} className="badge" style={{ minWidth: 90, justifyContent: 'center' }}>
                Panel {c.orderIndex + 1} · {c.durationSeconds}s
              </div>
            ))}
          </TrackRow>
          <TrackRow label="音频">
            <div className="badge">配音轨（{timeline.audioTrack[0]?.audioUrl ? '已生成' : '无'}）</div>
          </TrackRow>
          <TrackRow label="字幕">
            {timeline.subtitleTrack.length === 0 ? (
              <span className="muted" style={{ fontSize: '0.82rem' }}>无字幕</span>
            ) : (
              timeline.subtitleTrack.map((s, i) => (
                <span key={i} className="badge">{s.startSeconds}s：{s.text}</span>
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
