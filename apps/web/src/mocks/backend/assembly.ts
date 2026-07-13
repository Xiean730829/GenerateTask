// 后端式贪心 Panel 组装（前端不做任何分组计算）。
// 规则：按 Shot 原顺序累计时长；加入下一个 Shot 会超过视频 API 最大时长时，
// 关闭当前 Panel，从该 Shot 开始新 Panel；不为凑时长重排镜头。
import type { Id, Panel, Shot, ShotKeyframes } from '@/api/types'
import { mockId, nowIso } from './util'

export function assembleGreedy(
  episodeId: Id,
  shots: Shot[],
  keyframes: ShotKeyframes[],
  maxClipDurationSec: number,
): Panel[] {
  const selectedByShot = new Map<Id, Id>()
  for (const kf of keyframes) {
    if (kf.selectedKeyframeId) selectedByShot.set(kf.shotId, kf.selectedKeyframeId)
  }

  const ordered = [...shots].sort((a, b) => a.order - b.order)
  const panels: Panel[] = []
  let current: { shots: Shot[]; duration: number } | null = null

  const flush = () => {
    if (!current || current.shots.length === 0) return
    const ts = nowIso()
    panels.push({
      id: mockId('panel'),
      episodeId,
      order: panels.length + 1,
      shotIds: current.shots.map((s) => s.id),
      keyframeIds: current.shots.map((s) => selectedByShot.get(s.id) ?? ''),
      durationSec: current.duration,
      createdAt: ts,
    })
    current = null
  }

  for (const shot of ordered) {
    if (!current) {
      current = { shots: [shot], duration: shot.durationSec }
      continue
    }
    if (current.duration + shot.durationSec > maxClipDurationSec) {
      flush()
      current = { shots: [shot], duration: shot.durationSec }
    } else {
      current.shots.push(shot)
      current.duration += shot.durationSec
    }
  }
  flush()
  return panels
}
