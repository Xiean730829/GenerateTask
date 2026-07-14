import type { Panel, Shot } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { getShotPromptReferences } from '@/api/prompt-references'
import { mediaUrlFromId } from '@/lib/media-url'
import { MOVEMENT_LABELS, SHOT_SIZE_LABELS } from '@/features/shot/shot-labels'

function formatActionForPrompt(action: string): string {
  return (action.replace(/^.{1,4}/, '') || action).replace(/[。.…]+$/u, '').trim()
}

export function formatShotAssemblyPrompt(shot: Shot, visualStyle?: string | null): string[] {
  const references = getShotPromptReferences(shot)
  const character = references.find((reference) => reference.type === 'character')!
  const scene = references.find((reference) => reference.type === 'scene')!
  const prop = references.find((reference) => reference.type === 'prop')
  const styleName = visualStyle ?? references.find((reference) => reference.type === 'style')!.name
  const subject = prop ? `@${character.name} 与 @${prop.name}` : `@${character.name}`

  const lines = [
    `${SHOT_SIZE_LABELS[shot.shotSize ?? ''] ?? shot.shotSize}，${MOVEMENT_LABELS[shot.cameraMovement ?? ''] ?? shot.cameraMovement}机位。${subject} 在 @${scene.name} 中${formatActionForPrompt(shot.action ?? '')}。`,
    `画风：@${styleName}`,
  ]
  if (shot.dialogue?.trim()) {
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
  keyframes: import('@/api').Keyframe[]
  visualStyle?: string | null
}) {
  const grouped = groupKeyframesByShot(keyframes)
  const members = panel.shotIds
    .map((shotId) => shots.find((shot) => shot.id === shotId))
    .filter((shot): shot is Shot => !!shot)

  return (
    <section className="panel-composition-detail" aria-label={`Panel ${panel.orderIndex + 1} 组成详情`}>
      <header className="panel-composition-heading">
        <div>
          <h3>Panel {panel.orderIndex + 1} 组成</h3>
          <p className="muted">{panel.durationSeconds ?? 0}s · {panel.shotIds.length} 个镜头 · 按原顺序组装</p>
        </div>
      </header>

      <div className="panel-composition-shots">
        {members.map((shot) => {
          const entry = grouped.find((item) => item.shotId === shot.id)
          const keyframe = entry?.candidates.find((item) => item.id === entry.selectedKeyframeId)
          return (
            <article key={shot.id} className="panel-composition-shot">
              {keyframe ? (
                <img src={mediaUrlFromId(keyframe.mediaFileId)} alt={`镜头 ${shot.orderIndex + 1} 的关键帧`} />
              ) : (
                <div className="panel-composition-shot-empty">无关键帧</div>
              )}
              <span>镜头 {shot.orderIndex + 1}</span>
              <small>{shot.durationSeconds ?? 0}s</small>
            </article>
          )
        })}
      </div>

      <div className="panel-composition-prompts">
        <h4>组装提示词</h4>
        {members.map((shot) => (
          <article key={shot.id} className="panel-prompt-block">
            <strong>镜头 {shot.orderIndex + 1}</strong>
            {formatShotAssemblyPrompt(shot, visualStyle).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
