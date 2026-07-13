import { useMemo, useState } from 'react'
import type { Asset, Shot } from '@/api'
import { ASSET_KIND_LABELS } from '@/features/asset/asset-labels'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'
import type { PromptReference } from './ShotPromptPreview'

/** 选中镜头的按需素材工作区，同时提供用户级素材库的分类复用入口。 */
export function ShotMaterialsPanel({ shot, activeReference, enabled }: { shot: Shot; activeReference: PromptReference; enabled: boolean }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const [busy, setBusy] = useState(false)
  const linked = useMemo(
    () => shot.materialAssetIds.map((id) => state.assets.find((asset) => asset.id === id)).filter(Boolean) as Asset[],
    [shot.materialAssetIds, state.assets],
  )
  const visible = linked.filter((asset) => asset.kind === activeReference.kind && asset.name === activeReference.name)
  const ready = visible.length > 0 && visible.every((asset) => asset.imageStatus === 'confirmed')

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try { await work() } finally { setBusy(false) }
  }

  return (
    <section className="shot-materials">
      <div className="section-heading">
        <div>
          <h3>@{activeReference.name} 素材候选</h3>
          <p>仅展示此 Prompt 引用对应的{ASSET_KIND_LABELS[activeReference.kind]}素材。</p>
        </div>
        {ready ? <Badge tone="done">素材已就绪</Badge> : <Badge tone="pending">待确认素材</Badge>}
      </div>

      {visible.length === 0 ? (
        <div className="empty-inline">
          <span>正在载入“{activeReference.name}”的素材候选…</span>
        </div>
      ) : (
        <div className="materials-grid">
          {visible.map((asset) => (
            <MaterialCard key={asset.id} asset={asset} enabled={enabled} onRun={run} />
          ))}
        </div>
      )}
    </section>
  )
}

function MaterialCard({ asset, enabled, onRun }: { asset: Asset; enabled: boolean; onRun: (work: () => Promise<void>) => Promise<void> }) {
  const store = useWorkspaceStore()

  return (
    <article className="material-card">
      <div className="material-card-top"><Badge tone={asset.imageStatus === 'confirmed' ? 'done' : 'pending'}>{ASSET_KIND_LABELS[asset.kind]}</Badge><span>v{asset.version}</span></div>
      {asset.selectedImageUrl && <img className="material-preview" src={asset.selectedImageUrl} alt={`${asset.name} 已确认素材`} />}
      <h4>{asset.name}</h4>
      <p className="muted">{asset.description}</p>
      {asset.kind === 'character' && <p className="muted">音色：{asset.voice.preset}</p>}
      {asset.definitionStatus === 'draft' && <Button size="sm" disabled={!enabled} onClick={() => void onRun(async () => {
        await store.confirmAssetDefinition(asset.id)
        await store.generateAssetImage(asset.id)
      })}>确认并生成候选图</Button>}
      {asset.imageStatus === 'awaiting-confirmation' && (
        <HorizontalScroll className="asset-candidates" aria-label={`${asset.name} 的候选图片`}>
          {asset.imageCandidates.map((url) => <button key={url} type="button" disabled={!enabled} title="确认此素材图" onClick={() => void onRun(() => store.confirmAssetImage(asset.id, url))}><img src={url} alt={`${asset.name} 候选图`} /></button>)}
        </HorizontalScroll>
      )}
      {asset.imageStatus === 'confirmed' && <Badge tone="done">可跨项目复用</Badge>}
    </article>
  )
}
