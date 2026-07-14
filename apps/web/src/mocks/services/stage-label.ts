// 依据 Episode 状态推导首页展示用的阶段标签。
import type { EpisodeState } from '@/mocks/backend'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { isPanelVideoReady } from '@/api/types/panel'

export function deriveStageLabel(state: EpisodeState): string {
  if (state.exportRecord?.status === 'succeeded') return '已导出'
  if (state.timeline) return '时间线'
  if (state.panelVideos.some(isPanelVideoReady)) return 'Panel 视频'
  if (state.panels.length > 0) return 'Panel 组装'
  if (groupKeyframesByShot(state.keyframes).some((k) => k.selectedKeyframeId)) return '关键帧'
  if (state.shots.length > 0) return '镜头'
  if (state.script?.status === 'confirmed') return '镜头'
  if (state.script) return '剧本'
  return '输入'
}
