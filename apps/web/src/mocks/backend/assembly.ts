import type { Id, Panel, PanelRevision, Shot } from '@/api/types'
import type { Keyframe } from '@/api/types'
import { mockId, nowIso } from './util'

export function assembleGreedy(
  episodeId: Id,
  shots: Shot[],
  keyframes: Keyframe[],
  maxPanelDurationSeconds: number,
): { panels: Panel[]; revisions: PanelRevision[] } {
  const selectedMediaByShot = new Map<Id, Id>()
  for (const kf of keyframes) {
    if (kf.status === 'selected') selectedMediaByShot.set(kf.shotId, kf.mediaFileId)
  }

  const ordered = [...shots].sort((a, b) => a.orderIndex - b.orderIndex)
  const panels: Panel[] = []
  const revisions: PanelRevision[] = []
  let current: { shots: Shot[]; duration: number } | null = null

  const flush = () => {
    if (!current || current.shots.length === 0) return
    const ts = nowIso()
    const panelId = mockId('panel')
    const revisionId = mockId('panel-rev')
    const keyframeMediaIds = current.shots
      .map((shot) => selectedMediaByShot.get(shot.id))
      .filter((id): id is Id => !!id)

    revisions.push({
      id: revisionId,
      panelId,
      revisionNo: 1,
      shotPromptRevisionIds: current.shots.map(() => mockId('spr')),
      assetRevisionIds: [],
      keyframeMediaIds,
      createdAt: ts,
    })

    panels.push({
      id: panelId,
      episodeId,
      name: null,
      orderIndex: panels.length,
      shotIds: current.shots.map((s) => s.id),
      durationSeconds: current.duration,
      timeSpec: {},
      currentRevisionId: revisionId,
      createdAt: ts,
    })
    current = null
  }

  for (const shot of ordered) {
    const dur = shot.durationSeconds ?? 0
    if (!current) {
      current = { shots: [shot], duration: dur }
      continue
    }
    if (current.duration + dur > maxPanelDurationSeconds) {
      flush()
      current = { shots: [shot], duration: dur }
    } else {
      current.shots.push(shot)
      current.duration += dur
    }
  }
  flush()
  return { panels, revisions }
}
