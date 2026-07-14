import { useMemo, useState } from 'react'
import type { Asset, Shot } from '@/api'
import { getVoiceAttributes } from '@/api/types/asset'
import { ASSET_TYPE_LABELS } from '@/features/asset/asset-labels'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'
import type { PromptReference } from './ShotPromptPreview'

function isAssetReady(asset: Asset): boolean {
  return !!asset.currentRevisionId && !!asset.referenceImageUrl
}

/** 选中镜头的按需素材工作区，同时提供用户级素材库的分类复用入口。 */
export function ShotMaterialsPanel({ shot, activeReference, enabled }: { shot: Shot; activeReference: PromptReference; enabled: boolean }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const [busy, setBusy] = useState(false)
  const linked = useMemo(
    () => (state.shotAssets[shot.id] ?? []).filter(
      (asset) => asset.type === activeReference.type && asset.name === activeReference.name,
    ),
    [shot.id, state.shotAssets, activeReference],
  )
  const ready = linked.length > 0 && linked.every(isAssetReady)

  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try { await work() } finally { setBusy(false) }
  }

  return (
    <section className="shot-materials">
      <div className="section-heading">
        <div>
          <h3>@{activeReference.name} 素材候选</h3>
          <p>仅展示此 Prompt 引用对应的{ASSET_TYPE_LABELS[activeReference.type]}素材。</p>
        </div>
        {ready ? <Badge tone="done">素材已就绪</Badge> : <Badge tone="pending">待确认素材</Badge>}
      </div>

      {linked.length === 0 ? (
        <div className="empty-inline">
          <span>正在载入“{activeReference.name}”的素材候选…</span>
        </div>
      ) : (
        <div className="materials-grid">
          {linked.map((asset) => (
            <MaterialCard key={asset.id} asset={asset} enabled={enabled && !busy} onRun={run} />
          ))}
        </div>
      )}
    </section>
  )
}

function MaterialCard({ asset, enabled, onRun }: { asset: Asset; enabled: boolean; onRun: (work: () => Promise<void>) => Promise<void> }) {
  const store = useWorkspaceStore()
  const voice = getVoiceAttributes(asset)
  const ready = isAssetReady(asset)

  return (
    <article className="material-card">
      <div className="material-card-top">
        <Badge tone={ready ? 'done' : 'pending'}>{ASSET_TYPE_LABELS[asset.type]}</Badge>
        {asset.currentRevisionId && <span>已确认定义</span>}
      </div>
      {asset.referenceImageUrl && <img className="material-preview" src={asset.referenceImageUrl} alt={`${asset.name} 已确认素材`} />}
      <h4>{asset.name}</h4>
      <p className="muted">{asset.description}</p>
      {asset.type === 'character' && voice && <p className="muted">音色：{voice.preset}</p>}
      {!asset.currentRevisionId && (
        <Button size="sm" disabled={!enabled} onClick={() => void onRun(async () => {
          await store.confirmAssetDefinition(asset.id)
          await store.generateAssetImage(asset.id)
        })}>确认定义并生成参考图</Button>
      )}
      {asset.currentRevisionId && !asset.referenceImageUrl && (
        <span className="muted" style={{ fontSize: '0.82rem' }}>参考图生成中…</span>
      )}
      {ready && <Badge tone="done">可跨项目复用</Badge>}
    </article>
  )
}
