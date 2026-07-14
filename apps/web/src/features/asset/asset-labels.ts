import type { AssetType } from '@/api'

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  character: '角色',
  prop: '道具',
  scene: '场景',
  style: '风格',
}

export const ASSET_TYPE_TABS: AssetType[] = ['character', 'prop', 'scene', 'style']
