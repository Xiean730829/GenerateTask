import type { CameraMovement, ShotSize } from '@/api'

export const SHOT_SIZE_LABELS: Record<ShotSize, string> = {
  wide: '远景',
  full: '全景',
  medium: '中景',
  'close-up': '特写',
  'extreme-close-up': '大特写',
}

export const MOVEMENT_LABELS: Record<CameraMovement, string> = {
  static: '固定',
  pan: '摇镜',
  tilt: '俯仰',
  dolly: '推拉',
  tracking: '跟拍',
  zoom: '变焦',
}
