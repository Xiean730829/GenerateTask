import { useState } from 'react'
import type { Shot, UpdateShotInput } from '@/api'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'
import { shotDownstreamImpact } from './impact'
import { MOVEMENT_LABELS, SHOT_SIZE_LABELS } from './shot-labels'

/** 单个 Shot 卡：展示并编辑结构化分镜字段；保存前提示下游失效影响。 */
export function ShotCard({ shot, editable }: { shot: Shot; editable: boolean }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const [draft, setDraft] = useState<UpdateShotInput>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  const value = { ...shot, ...draft }
  const dirty = Object.keys(draft).length > 0
  const set = (patch: UpdateShotInput) => setDraft((d) => ({ ...d, ...patch }))

  const attemptSave = () => {
    const impact = shotDownstreamImpact(state, shot.id)
    if (impact.affectedPanelVideos > 0 || impact.timelineAffected) setConfirmOpen(true)
    else void doSave()
  }

  const doSave = async () => {
    setConfirmOpen(false)
    await store.saveShot(shot.id, draft)
    setDraft({})
  }

  const impact = shotDownstreamImpact(state, shot.id)

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>镜头 {shot.order}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>时长 {value.durationSec}s</span>
      </div>
      <div className="grid-2">
        <label className="stack" style={{ gap: '0.25rem' }}>
          <span className="muted" style={{ fontSize: '0.78rem' }}>时长（秒）</span>
          <input type="number" min={1} disabled={!editable} value={value.durationSec}
            onChange={(e) => set({ durationSec: Number(e.target.value) || 1 })} />
        </label>
        <label className="stack" style={{ gap: '0.25rem' }}>
          <span className="muted" style={{ fontSize: '0.78rem' }}>景别</span>
          <select disabled={!editable} value={value.size} onChange={(e) => set({ size: e.target.value as Shot['size'] })}>
            {Object.entries(SHOT_SIZE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="stack" style={{ gap: '0.25rem' }}>
          <span className="muted" style={{ fontSize: '0.78rem' }}>运镜</span>
          <select disabled={!editable} value={value.movement} onChange={(e) => set({ movement: e.target.value as Shot['movement'] })}>
            {Object.entries(MOVEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <label className="stack" style={{ gap: '0.25rem' }}>
        <span className="muted" style={{ fontSize: '0.78rem' }}>动作</span>
        <textarea rows={2} disabled={!editable} value={value.action} onChange={(e) => set({ action: e.target.value })} />
      </label>
      <label className="stack" style={{ gap: '0.25rem' }}>
        <span className="muted" style={{ fontSize: '0.78rem' }}>台词</span>
        <textarea rows={2} disabled={!editable} value={value.dialogue} onChange={(e) => set({ dialogue: e.target.value })} />
      </label>
      {editable && dirty && (
        <div className="row">
          <Button size="sm" variant="primary" onClick={attemptSave}>保存修改</Button>
          <Button size="sm" variant="ghost" onClick={() => setDraft({})}>撤销</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="修改将使下游结果失效"
        message={
          <>修改此镜头会使 {impact.affectedPanelVideos} 个 Panel 视频{impact.timelineAffected ? ' 和当前时间线' : ''}失效，需重新生成。是否继续？</>
        }
        onConfirm={() => void doSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
