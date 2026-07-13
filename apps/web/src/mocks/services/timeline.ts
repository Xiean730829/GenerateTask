import type { TimelineService } from '@/api/contracts'
import type { SubtitleCue, Timeline, TimelineClip } from '@/api/types'
import { backend } from '@/mocks/backend'
import { clone, mockId, nowIso } from '@/mocks/backend/util'

export const mockTimelineService: TimelineService = {
  async getByEpisode(episodeId) {
    const tl = backend.db.getEpisodeState(episodeId).timeline
    return tl ? clone(tl) : null
  },

  async compose(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const task = backend.engine.start({
      episodeId,
      taskType: 'timeline.compose',
      onSucceed: () => {
        const s = backend.db.getEpisodeState(episodeId)
        const clips: TimelineClip[] = s.panels.map((p) => {
          const v = s.panelVideos.find((x) => x.panelId === p.id)
          return {
            panelId: p.id,
            order: p.order,
            videoUrl: v?.videoUrl ?? null,
            durationSec: p.durationSec,
          }
        })
        const subtitles = buildSubtitles(s)
        const ts = nowIso()
        const timeline: Timeline = {
          id: s.timeline?.id ?? mockId('tl'),
          episodeId,
          clips,
          audioUrl: 'mock://audio-track',
          subtitles,
          totalDurationSec: clips.reduce((sum, c) => sum + c.durationSec, 0),
          freshness: 'fresh',
          taskId: null,
          createdAt: s.timeline?.createdAt ?? ts,
          updatedAt: ts,
        }
        s.timeline = timeline
        return { timelineId: timeline.id }
      },
    })
    return { taskId: task.taskId }
  },
}

function buildSubtitles(state: ReturnType<typeof backend.db.getEpisodeState>): SubtitleCue[] {
  const cues: SubtitleCue[] = []
  let cursor = 0
  const shotById = new Map(state.shots.map((s) => [s.id, s]))
  for (const panel of state.panels) {
    for (const shotId of panel.shotIds) {
      const shot = shotById.get(shotId)
      if (!shot) continue
      if (shot.dialogue) {
        cues.push({ startSec: cursor, endSec: cursor + shot.durationSec, text: shot.dialogue })
      }
      cursor += shot.durationSec
    }
  }
  return cues
}
