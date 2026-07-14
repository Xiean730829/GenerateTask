import type { Shot } from '@/api'
import { getShotPromptReferences, type PromptReference } from '@/api/prompt-references'
import { Badge } from '@/components/ui/Badge'
import { ASSET_TYPE_LABELS } from '@/features/asset/asset-labels'
import { MOVEMENT_LABELS, SHOT_SIZE_LABELS } from './shot-labels'

/**
 * MS1 镜头 Prompt 只读视图。
 * 文本来自既有 Shot 结构化字段；@ 仅为素材引用的展示与候选选择入口，不提供文本编辑。
 */
export type { PromptReference } from '@/api/prompt-references'

export function ShotPromptPreview({
  shot,
  activeReference,
  onSelectReference,
  visualStyle,
}: {
  shot: Shot
  activeReference: PromptReference
  onSelectReference: (reference: PromptReference) => void
  /** 项目级视觉风格，与创建页设定一致。 */
  visualStyle?: string | null
}) {
  const references = getShotPromptReferences(shot)
  const character = references.find((reference) => reference.type === 'character')!
  const scene = references.find((reference) => reference.type === 'scene')!
  const prop = references.find((reference) => reference.type === 'prop')
  const style = references.find((reference) => reference.type === 'style')!
  const styleRef = visualStyle ? { ...style, name: visualStyle } : style

  return (
    <section className="card shot-prompt-preview">
      <div className="prompt-heading">
        <h3>镜头 {shot.orderIndex + 1}</h3>
        <Badge tone="active">只读 Prompt</Badge>
      </div>
      <div className="prompt-kicker">结构化提示词</div>
      <p className="prompt-copy">
        {SHOT_SIZE_LABELS[shot.shotSize ?? ''] ?? shot.shotSize}，{MOVEMENT_LABELS[shot.cameraMovement ?? ''] ?? shot.cameraMovement}机位。<AssetMention reference={character} active={sameReference(activeReference, character)} onSelect={onSelectReference} />
        {prop ? <> 与 <AssetMention reference={prop} active={sameReference(activeReference, prop)} onSelect={onSelectReference} /></> : null}
        {' '}在 <AssetMention reference={scene} active={sameReference(activeReference, scene)} onSelect={onSelectReference} /> 中{formatActionForPrompt(shot.action ?? '')}。
      </p>
      <p className="prompt-style">
        画风：<AssetMention reference={styleRef} active={sameReference(activeReference, styleRef)} onSelect={onSelectReference} />
      </p>
      {shot.dialogue?.trim() && <p className="prompt-dialogue">
        台词：<AssetMention reference={character} active={sameReference(activeReference, character)} onSelect={onSelectReference} />（迟疑，低声）：“{shot.dialogue}”
      </p>}
      <div className="prompt-references">
        <span>引用资产</span>
        {references.map((reference) => (
          <Badge key={`${reference.type}-${reference.name}`} tone="active">{ASSET_TYPE_LABELS[reference.type]}</Badge>
        ))}
      </div>
      <p className="prompt-selection">为“{activeReference.name}”选择素材候选</p>
      <p className="prompt-note">Prompt 由镜头生成，MS1 仅展示；素材候选的选择会更新引用，不开放文本修改。</p>
    </section>
  )
}

function AssetMention({ reference, active, onSelect }: { reference: PromptReference; active: boolean; onSelect: (reference: PromptReference) => void }) {
  return <button type="button" className={`asset-mention ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={() => onSelect(reference)}>@{reference.name}</button>
}

export const getPromptReferences = getShotPromptReferences

function sameReference(a: PromptReference, b: PromptReference): boolean {
  return a.name === b.name && a.type === b.type
}

/** 动作字段常含角色名前缀与句末标点；拼进 Prompt 时只保留一句一句号。 */
function formatActionForPrompt(action: string): string {
  return (action.replace(/^.{1,4}/, '') || action).replace(/[。.…]+$/u, '').trim()
}
