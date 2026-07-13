import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { useWorkspaceState } from '@/stores/workspace-context'

/** 底部时间线条：仅在有 Panel 视频或已进入合成阶段后出现，展示 Panel 顺序缩览。 */
export function TimelineBar() {
  const state = useWorkspaceState()
  const clips = state.timeline?.clips ?? state.panels.map((p) => ({
    panelId: p.id,
    order: p.order,
    durationSec: p.durationSec,
    videoUrl: state.panelVideos.find((v) => v.panelId === p.id)?.videoUrl ?? null,
  }))

  return (
    <div className="timeline-bar">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          时间线预览
        </span>
        {state.timeline && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {state.timeline.freshness === 'stale' ? '已失效 · 需重新合成' : `总时长 ${state.timeline.totalDurationSec}s`}
          </span>
        )}
      </div>
      <HorizontalScroll className="timeline-clips">
        {clips.map((c) => (
          <div key={c.panelId} className="timeline-clip">
            P{c.order} · {c.durationSec}s
          </div>
        ))}
      </HorizontalScroll>
    </div>
  )
}
