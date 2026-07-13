import type { Freshness, Id, IsoDateTime } from './common'

/** 时间线上的一段 Panel 视频轨。 */
export interface TimelineClip {
  panelId: Id
  order: number
  videoUrl: string | null
  durationSec: number
}

/** 字幕条目。 */
export interface SubtitleCue {
  startSec: number
  endSec: number
  text: string
}

/**
 * Timeline：只读交付预览区，展示 Panel 顺序、音频轨与字幕轨。
 * 内容修改必须回到 Shot 或 Panel 后重新合成。
 */
export interface Timeline {
  id: Id
  episodeId: Id
  clips: TimelineClip[]
  /** 音频轨预览地址。 */
  audioUrl: string | null
  subtitles: SubtitleCue[]
  totalDurationSec: number
  freshness: Freshness
  taskId: Id | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
