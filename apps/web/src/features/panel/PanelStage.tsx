import { useEffect, useRef, useState } from 'react'
import { isPanelVideoReady } from '@/api/types/panel'
import { Button } from '@/components/ui/Button'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { StageHeader } from '@/features/episode/StageHeader'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'
import { PanelCompositionDetail } from './PanelCompositionDetail'
import { PanelVideoCard } from './PanelVideoCard'

/**
 * Panel 工作台：进入页面即由后端自动组装；Panel 与其视频在同一条横向胶卷中查看和生成。
 * 前端不计算分组，也不要求用户额外确认“组装”。
 */
export function PanelStage({ onNext }: { onNext: () => void }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const started = useRef(false)
  const [assembling, setAssembling] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
  const needsAssembly = state.panels.length === 0 || state.panelVideos.some((video) => video.status === 'stale')
  const selectedPanel = state.panels.find((panel) => panel.id === selectedPanelId) ?? state.panels[0]

  useEffect(() => {
    if (state.panels.length === 0) {
      setSelectedPanelId(null)
      return
    }
    setSelectedPanelId((current) => (
      current && state.panels.some((panel) => panel.id === current) ? current : state.panels[0].id
    ))
  }, [state.panels])

  useEffect(() => {
    if (!needsAssembly || started.current) return
    started.current = true
    setAssembling(true)
    void store.assemblePanels().finally(() => setAssembling(false))
  }, [needsAssembly, store])

  const pending = state.panelVideos.filter((video) => video.status === 'pending' || video.status === 'failed' || video.status === 'stale').length
  const allReady = state.panelVideos.length > 0 && state.panelVideos.every(isPanelVideoReady)
  const batch = async () => {
    setBusy(true)
    try { await store.generateAllPanelVideos() } finally { setBusy(false) }
  }

  return (
    <section className="panel-workbench">
      <StageHeader
        title="Panel 与视频"
        desc={assembling
          ? '正在按当前视频能力自动组装 Panel…'
          : `已由后端按原始镜头顺序与视频能力自动组装；在下方胶卷中单个或批量生成视频。`}
        actions={<>
          <Button disabled={assembling || busy || pending === 0} onClick={() => void batch()}>批量生成（{pending} 个待处理）</Button>
          <Button variant="primary" disabled={!allReady} onClick={onNext}>生成时间线 →</Button>
        </>}
      />
      {assembling && <p className="muted">组装完成后会自动显示 Panel 胶卷。</p>}
      {!assembling && state.panels.length > 0 && <>
        <div className="filmstrip-label"><span>Panel 胶卷</span><span>拖动或滚轮横向浏览 · 每个 Panel 是视频生成与重做的最小单位</span></div>
        <HorizontalScroll bleed aria-label="Panel 视频胶卷">
          <div className="panel-filmstrip">
          {state.panels.map((panel) => {
            const video = state.panelVideos.find((item) => item.panelId === panel.id)
            return video ? (
              <PanelVideoCard
                key={panel.id}
                panel={panel}
                video={video}
                selected={selectedPanel?.id === panel.id}
                onSelect={() => setSelectedPanelId(panel.id)}
              />
            ) : null
          })}
          </div>
        </HorizontalScroll>
        {selectedPanel && (
          <PanelCompositionDetail
            panel={selectedPanel}
            shots={state.shots}
            keyframes={state.keyframes}
            visualStyle={state.project?.style}
          />
        )}
      </>}
    </section>
  )
}
