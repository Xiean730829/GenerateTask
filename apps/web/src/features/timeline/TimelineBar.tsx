import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { isTimelineFresh } from '@/api/types/timeline'
import { useWorkspaceState } from '@/stores/workspace-context'

/** 底部时间线条：仅在有 Panel 视频或已进入合成阶段后出现，展示 Panel 顺序缩览。 */
export function TimelineBar() {
  const state = useWorkspaceState()
  const clips = state.timeline?.videoTrack ?? state.panels.map((p) => ({
    panelId: p.id,
    orderIndex: p.orderIndex,
    durationSeconds: p.durationSeconds ?? 0,
    videoUrl: state.panelVideos.find((v) => v.panelId === p.id)?.videoUrl ?? null,
  }))

  const totalDuration = state.timeline
    ? state.timeline.videoTrack.reduce((s, c) => s + c.durationSeconds, 0)
    : clips.reduce((s, c) => s + c.durationSeconds, 0)

  return (
    <div className="timeline-bar">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          时间线预览
        </span>
        {state.timeline && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {!isTimelineFresh(state.timeline) ? '已失效 · 需重新合成' : `总时长 ${totalDuration}s`}
          </span>
        )}
      </div>
      <HorizontalScroll className="timeline-clips">
        {clips.map((c) => (
          <div key={c.panelId} className="timeline-clip">
            P{c.orderIndex + 1} · {c.durationSeconds}s
          </div>
        ))}
      </HorizontalScroll>
    </div>
  )
}
