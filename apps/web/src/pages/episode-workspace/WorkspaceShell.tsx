import { useEffect, useState } from 'react'
import type { StageKey } from '@/api'
import { isPanelVideoReady } from '@/api/types/panel'
import { useWorkspaceState } from '@/stores/workspace-context'
import { StageNav } from '@/features/episode/StageNav'
import { TimelineBar } from '@/features/timeline/TimelineBar'
import { StageCanvas } from './StageCanvas'
import { pickInitialStage } from '@/features/episode/pick-stage'

export function WorkspaceShell() {
  const state = useWorkspaceState()
  const [stage, setStage] = useState<StageKey>('input')
  const [pinned, setPinned] = useState(false)

  // 首次就绪后跳到当前进行中的阶段；此后尊重用户手动切换。
  useEffect(() => {
    if (state.load === 'ready' && !pinned) {
      setStage(pickInitialStage(state))
      setPinned(true)
    }
  }, [state, pinned])

  if (state.load === 'loading' || state.load === 'idle') {
    return <div className="workspace-body">正在加载工作台…</div>
  }
  if (state.load === 'error') {
    return <div className="workspace-body inline-error">加载失败：{state.error}</div>
  }

  const showTimelineBar = state.panelVideos.some(isPanelVideoReady) || !!state.timeline

  return (
    <>
      <StageNav current={stage} onSelect={setStage} />
      <div className="workspace-body">
        <StageCanvas stage={stage} onNavigate={setStage} />
      </div>
      {showTimelineBar && <TimelineBar />}
    </>
  )
}
