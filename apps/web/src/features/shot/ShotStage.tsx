import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Asset, Shot } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { getShotPromptReferences } from '@/api/prompt-references'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
import { StageHeader } from '@/features/episode/StageHeader'
import { allShotsHaveSelectedKeyframe } from '@/features/episode/stages'
import { useLatestTaskByType } from '@/hooks/useLatestTaskByType'
import { mediaUrlFromId } from '@/lib/media-url'
import { useWorkspaceState, useWorkspaceStore } from '@/stores/workspace-context'
import { ShotMaterialsPanel } from './ShotMaterialsPanel'
import { type PromptReference, ShotPromptPreview } from './ShotPromptPreview'

function isAssetReady(asset: Asset): boolean {
  return !!asset.currentRevisionId && !!asset.referenceImageUrl
}

/** MS1 Prompt 每类只渲染一个引用；已关联但未渲染的历史资产不能阻塞生成。 */
function promptAssetsForShot(shot: Shot, shotAssets: Asset[]): Asset[] {
  return getShotPromptReferences(shot).map((reference) =>
    shotAssets.find((asset) => asset.type === reference.type && asset.name === reference.name),
  ).filter((asset): asset is Asset => !!asset)
}

/**
 * 镜头工作台：胶卷单选编辑 → 按镜头准备素材 → 固定九宫格关键帧。
 * 素材和关键帧不再是独立阶段。
 */
export function ShotStage({ onNext }: { onNext: () => void }) {
  const store = useWorkspaceStore()
  const state = useWorkspaceState()
  const shotTask = useLatestTaskByType('shot.generate')
  const keyframesByShot = useMemo(() => groupKeyframesByShot(state.keyframes), [state.keyframes])
  const [selectedId, setSelectedId] = useState<string | null>(state.shots[0]?.id ?? null)
  const [busy, setBusy] = useState(false)
  const generatingShots = state.shots.length === 0 && state.script?.status === 'confirmed' && shotTask?.status !== 'failed'
  const selected = state.shots.find((shot) => shot.id === selectedId) ?? state.shots[0]
  const [requestedReference, setRequestedReference] = useState<PromptReference | null>(null)
  const preparedShotIds = useRef(new Set<string>())
  const promptReferences = selected ? getShotPromptReferences(selected) : []
  const activeReference = promptReferences.find((reference) => reference.name === requestedReference?.name && reference.type === requestedReference?.type)
    ?? promptReferences.find((reference) => reference.type === 'scene')
    ?? promptReferences[0]
  const allSelected = allShotsHaveSelectedKeyframe(state)
  const firstPendingIndex = state.shots.findIndex((shot) => !keyframesByShot.some((entry) => entry.shotId === shot.id && entry.selectedKeyframeId))
  const nextBatch = useMemo(() => {
    if (firstPendingIndex < 0) return []
    const remaining = state.shots.slice(firstPendingIndex)
    return remaining.slice(0, 9)
  }, [firstPendingIndex, state.shots])
  const pendingMaterials = nextBatch.map((shot) => {
    const expected = getShotPromptReferences(shot).length
    const linked = promptAssetsForShot(shot, state.shotAssets[shot.id] ?? [])
    const unconfirmed = linked.filter((asset) => !isAssetReady(asset))
    return { shot, linked, unconfirmed, expected }
  }).filter(({ linked, unconfirmed, expected }) => linked.length !== expected || unconfirmed.length > 0)
  const pendingByShotId = useMemo(
    () => new Map(pendingMaterials.map((item) => [item.shot.id, item])),
    [pendingMaterials],
  )
  const nextBatchIds = useMemo(() => new Set(nextBatch.map((shot) => shot.id)), [nextBatch])
  const batchReady = nextBatch.length > 0 && pendingMaterials.length === 0
  const materialBlockerSummary = pendingMaterials.length > 0
    ? `镜头 ${pendingMaterials.map(({ shot }) => shot.orderIndex + 1).join('、')} 素材未就绪`
    : undefined
  const nextEntry = nextBatch[0] && keyframesByShot.find((entry) => entry.shotId === nextBatch[0].id)
  const nextHasCandidate = !!nextEntry?.candidates.length && !nextEntry.selectedKeyframeId

  useEffect(() => {
    if (!selected || (state.shotAssets[selected.id]?.length ?? 0) > 0 || preparedShotIds.current.has(selected.id)) return
    preparedShotIds.current.add(selected.id)
    void store.prepareShotMaterials(selected.id)
  }, [selected, state.shotAssets, store])

  useEffect(() => {
    if (state.shots.length > 0 && !state.shots.some((shot) => shot.id === selectedId)) {
      setSelectedId(state.shots[0].id)
    }
  }, [state.shots, selectedId])

  const generateNext = async () => {
    setBusy(true)
    try { await store.generateNextKeyframeBatch() } finally { setBusy(false) }
  }

  return (
    <section className="shot-workbench">
      <StageHeader
        title="镜头工作台"
        desc="在胶卷中查看镜头生成的只读 Prompt，并为其中引用的素材选择候选。关键帧固定按连续九宫格生成，尾部以空格补齐。"
        actions={generatingShots
          ? undefined
          : allSelected
            ? <Button variant="primary" onClick={onNext}>组装剧情片段 →</Button>
            : <Button disabled={busy || !batchReady || nextHasCandidate} title={materialBlockerSummary} onClick={() => void generateNext()}>
              {`生成关键帧九宫格（${nextBatch.length} 镜头${nextBatch.length < 9 ? `，${9 - nextBatch.length} 空位` : ''}）`}
            </Button>}
      />

      {generatingShots ? (
        <>
          <div className="card stack stage-loading">
            <TaskStatusInline task={shotTask} />
            <p className="muted">正在将剧本拆分为镜头分镜，胶卷生成后会自动显示。</p>
          </div>
          <div className="filmstrip-label">
            <span>镜头胶卷</span>
            <span>生成中…</span>
          </div>
          <FilmstripSkeleton />
        </>
      ) : state.shots.length === 0 ? (
        <div className="card stack">
          <TaskStatusInline task={shotTask} />
          {!shotTask && <p className="muted">剧本确认后会在这里生成镜头胶卷。</p>}
        </div>
      ) : <>
        <div className="filmstrip-label">
          <span>镜头胶卷</span>
          <span>
            {!allSelected && !batchReady && !nextHasCandidate && pendingMaterials.length > 0
              ? '九宫格尚不能生成 · 各镜头下方为待选素材'
              : '拖动或滚轮横向浏览 · 点击查看 Prompt 与素材引用'}
          </span>
        </div>
        <HorizontalScroll bleed role="list" aria-label="镜头胶卷">
          <div className="filmstrip">
          {state.shots.map((shot) => {
            const entry = keyframesByShot.find((item) => item.shotId === shot.id)
            const selectedKeyframe = entry?.selectedKeyframeId
            const keyframePreview = entry?.candidates.find((item) => item.id === selectedKeyframe) ?? entry?.candidates[0]
            const expectedRefs = getShotPromptReferences(shot).length
            const promptAssets = promptAssetsForShot(shot, state.shotAssets[shot.id] ?? [])
            const materialReady = promptAssets.length === expectedRefs && promptAssets.every(isAssetReady)
            const pendingCount = promptAssets.length !== expectedRefs
              ? null
              : promptAssets.filter((asset) => !isAssetReady(asset)).length
            const pending = pendingByShotId.get(shot.id)
            const showKeyframeConfirm = !allSelected && nextHasCandidate && nextBatch[0]?.id === shot.id
            return <div key={shot.id} className="film-item" role="listitem">
              <button type="button" className={`film-card ${selected?.id === shot.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(shot.id)}>
                <div className="film-card-head">
                  <span className="film-shot">镜头 {shot.orderIndex + 1}</span>
                  <span>{shot.durationSeconds ?? 0}s</span>
                </div>
                {keyframePreview && (
                  <div className={`film-keyframe ${selectedKeyframe ? 'is-confirmed' : ''}`}>
                    <img src={mediaUrlFromId(keyframePreview.mediaFileId)} alt={`镜头 ${shot.orderIndex + 1} 的关键帧`} />
                  </div>
                )}
                <small>{selectedKeyframe ? '关键帧已确认' : materialReady ? '可生成关键帧' : pendingCount === null ? '候选准备中' : `待选 ${pendingCount} 项`}</small>
              </button>
              {showKeyframeConfirm && keyframePreview ? (
                <FilmItemBlocker
                  text="待确认关键帧"
                  onClick={() => {
                    setSelectedId(shot.id)
                    void store.selectKeyframe(shot.id, keyframePreview.id)
                  }}
                />
              ) : !allSelected && nextBatchIds.has(shot.id) && pending ? (
                <FilmItemBlocker
                  preparing={pending.linked.length !== pending.expected}
                  unconfirmed={pending.unconfirmed}
                />
              ) : null}
            </div>
          })}
          </div>
        </HorizontalScroll>
        {!allSelected && (nextHasCandidate || batchReady) && (
          <p className="batch-note">
            {nextHasCandidate
              ? `请先确认镜头 ${(nextBatch[0]?.orderIndex ?? 0) + 1} 的关键帧，才能继续下一组。`
              : `下一次将按顺序生成镜头 ${nextBatch.map((shot) => shot.orderIndex + 1).join('、')} 的一张九宫格${nextBatch.length < 9 ? `，剩余 ${9 - nextBatch.length} 格留空` : ''}。`}
          </p>
        )}
        {selected && activeReference && <div className="shot-detail-grid">
          <div className="shot-settings"><ShotPromptPreview shot={selected} activeReference={activeReference} onSelectReference={setRequestedReference} visualStyle={state.project?.style} /></div>
          <ShotMaterialsPanel shot={selected} activeReference={activeReference} enabled />
        </div>}
      </>}
    </section>
  )
}

function FilmItemBlocker({
  text,
  preparing,
  unconfirmed,
  onClick,
}: {
  text?: string
  preparing?: boolean
  unconfirmed?: Asset[]
  onClick?: () => void
}) {
  const className = `film-blocker${onClick ? ' is-action' : ''}`
  let content: ReactNode = null

  if (text) {
    content = <span className="film-blocker-text">{text}</span>
  } else if (preparing) {
    content = <span className="film-blocker-text">候选准备中</span>
  } else if (unconfirmed?.length) {
    content = (
      <div className="film-blocker-tags">
        {unconfirmed.map((asset, index) => (
          <Badge key={asset?.id ?? index} tone="pending">
            {asset ? `@${asset.name}` : '素材候选'}
          </Badge>
        ))}
      </div>
    )
  }

  if (!content) return null

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <div className={className} role="status">
      {content}
    </div>
  )
}

function FilmstripSkeleton({ count = 5 }: { count?: number }) {
  return (
    <HorizontalScroll bleed aria-hidden>
      <div className="filmstrip">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="film-item">
            <div className="film-card film-card-skeleton" />
          </div>
        ))}
      </div>
    </HorizontalScroll>
  )
}
