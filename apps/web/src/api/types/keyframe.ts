import type { Id, IsoDateTime } from './common'

export type KeyframeStatus = 'candidate' | 'selected' | 'rejected' | 'stale'

/** 关键帧，与 keyframe.schema.json 对齐。 */
export interface Keyframe {
  id: Id
  shotId: Id
  mediaFileId: Id
  status: KeyframeStatus
  promptRevisionId: Id | null
  createdAt: IsoDateTime
}

/** 视图层：按 Shot 分组关键帧（非 REST 实体）。 */
export interface KeyframesByShot {
  shotId: Id
  candidates: Keyframe[]
  selectedKeyframeId: Id | null
}

export function groupKeyframesByShot(keyframes: Keyframe[]): KeyframesByShot[] {
  const map = new Map<Id, Keyframe[]>()
  for (const kf of keyframes) {
    const list = map.get(kf.shotId) ?? []
    list.push(kf)
    map.set(kf.shotId, list)
  }
  return [...map.entries()].map(([shotId, candidates]) => ({
    shotId,
    candidates,
    selectedKeyframeId: candidates.find((c) => c.status === 'selected')?.id ?? null,
  }))
}
