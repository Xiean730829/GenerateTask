import type { Panel, Shot, ShotKeyframes } from '@/api'
import { getShotPromptReferences } from '@/api/prompt-references'
import { MOVEMENT_LABELS, SHOT_SIZE_LABELS } from '@/features/shot/shot-labels'

function formatActionForPrompt(action: string): string {
  return (action.replace(/^.{1,4}/, '') || action).replace(/[。.…]+$/u, '').trim()
}

export function formatShotAssemblyPrompt(shot: Shot, visualStyle?: string | null): string[] {
  const references = getShotPromptReferences(shot)
  const character = references.find((reference) => reference.kind === 'character')!
  const scene = references.find((reference) => reference.kind === 'scene')!
  const prop = references.find((reference) => reference.kind === 'prop')
  const styleName = visualStyle ?? references.find((reference) => reference.kind === 'style')!.name
  const subject = prop ? `@${character.name} 与 @${prop.name}` : `@${character.name}`

  const lines = [
    `${SHOT_SIZE_LABELS[shot.size]}，${MOVEMENT_LABELS[shot.movement]}机位。${subject} 在 @${scene.name} 中${formatActionForPrompt(shot.action)}。`,
    `画风：@${styleName}`,
  ]
  if (shot.dialogue.trim()) {
    lines.push(`台词：@${character.name}（迟疑，低声）：“${shot.dialogue}”`)
  }
  return lines
}

/** 选中 Panel 的组成详情：成员镜头关键帧与组装提示词。 */
export function PanelCompositionDetail({
  panel,
  shots,
  keyframes,
  visualStyle,
}: {
  panel: Panel
  shots: Shot[]
  keyframes: ShotKeyframes[]
  visualStyle?: string | null
}) {
  const members = panel.shotIds
    .map((shotId) => shots.find((shot) => shot.id === shotId))
    .filter((shot): shot is Shot => !!shot)

  return (
    <section className="panel-composition-detail" aria-label={`Panel ${panel.order} 组成详情`}>
      <header className="panel-composition-heading">
        <div>
          <h3>Panel {panel.order} 组成</h3>
          <p className="muted">{panel.durationSec}s · {panel.shotIds.length} 个镜头 · 按原顺序组装</p>
        </div>
      </header>

      <div className="panel-composition-shots">
        {members.map((shot) => {
          const entry = keyframes.find((item) => item.shotId === shot.id)
          const keyframe = entry?.candidates.find((item) => item.id === entry.selectedKeyframeId)
          return (
            <article key={shot.id} className="panel-composition-shot">
              {keyframe ? (
                <img src={keyframe.imageUrl} alt={`镜头 ${shot.order} 的关键帧`} />
              ) : (
                <div className="panel-composition-shot-empty">无关键帧</div>
              )}
              <span>镜头 {shot.order}</span>
              <small>{shot.durationSec}s</small>
            </article>
          )
        })}
      </div>

      <div className="panel-composition-prompts">
        <h4>组装提示词</h4>
        {members.map((shot) => (
          <article key={shot.id} className="panel-prompt-block">
            <strong>镜头 {shot.order}</strong>
            {formatShotAssemblyPrompt(shot, visualStyle).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
