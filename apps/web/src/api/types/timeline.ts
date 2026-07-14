import type { Id, IsoDateTime } from './common'

/** MS1 最小视频轨元素。 */
export interface TimelineVideoClip {
  panelId: Id
  orderIndex: number
  mediaFileId: Id | null
  durationSeconds: number
  videoUrl?: string | null
}

export interface TimelineAudioClip {
  mediaFileId: Id | null
  audioUrl?: string | null
}

export interface TimelineSubtitleCue {
  startSeconds: number
  endSeconds: number
  text: string
}

/** 时间线，与 timeline.schema.json 对齐。 */
export interface Timeline {
  id: Id
  episodeId: Id
  status: string
  videoTrack: TimelineVideoClip[]
  audioTrack: TimelineAudioClip[]
  subtitleTrack: TimelineSubtitleCue[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export function isTimelineFresh(timeline: Timeline | null): boolean {
  return !!timeline && timeline.status !== 'stale'
}
