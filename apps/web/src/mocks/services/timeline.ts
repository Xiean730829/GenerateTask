import type { TimelineService } from '@/api/contracts'
import type { Timeline, TimelineSubtitleCue, TimelineVideoClip } from '@/api/types'
import { backend } from '@/mocks/backend'
import { clone, mockId, nowIso } from '@/mocks/backend/util'

function buildTimeline(episodeId: string): Timeline {
  const state = backend.db.getEpisodeState(episodeId)
  const videoTrack: TimelineVideoClip[] = state.panels.map((p) => {
    const v = state.panelVideos.find((x) => x.panelId === p.id)
    return {
      panelId: p.id,
      orderIndex: p.orderIndex,
      mediaFileId: v?.mediaFileId ?? null,
      durationSeconds: p.durationSeconds ?? 0,
      videoUrl: v?.videoUrl ?? null,
    }
  })
  const subtitleTrack = buildSubtitles(state)
  const ts = nowIso()
  return {
    id: state.timeline?.id ?? mockId('tl'),
    episodeId,
    status: 'ready',
    videoTrack,
    audioTrack: [{ mediaFileId: mockId('media'), audioUrl: 'mock://audio-track' }],
    subtitleTrack,
    createdAt: state.timeline?.createdAt ?? ts,
    updatedAt: ts,
  }
}

export const mockTimelineService: TimelineService = {
  async getByEpisode(episodeId) {
    const tl = backend.db.getEpisodeState(episodeId).timeline
    return tl ? clone(tl) : null
  },

  async generateAudioSubtitle(episodeId) {
    const task = backend.engine.start({
      episodeId,
      taskType: 'audio.subtitle',
      onSucceed: () => ({ episodeId }),
    })
    return { taskId: task.id }
  },

  async compose(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const timeline = buildTimeline(episodeId)
    state.timeline = timeline
    return clone(timeline)
  },
}

function buildSubtitles(state: ReturnType<typeof backend.db.getEpisodeState>): TimelineSubtitleCue[] {
  const cues: TimelineSubtitleCue[] = []
  let cursor = 0
  const shotById = new Map(state.shots.map((s) => [s.id, s]))
  for (const panel of state.panels) {
    for (const shotId of panel.shotIds) {
      const shot = shotById.get(shotId)
      if (!shot) continue
      const dur = shot.durationSeconds ?? 0
      if (shot.dialogue) {
        cues.push({ startSeconds: cursor, endSeconds: cursor + dur, text: shot.dialogue })
      }
      cursor += dur
    }
  }
  return cues
}
