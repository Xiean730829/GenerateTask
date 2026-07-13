import type { AssetKind } from '@/api'

/** 资产库 Tab 顺序：角色 → 道具 → 场景 → 风格。 */
export const ASSET_KIND_TABS: AssetKind[] = ['character', 'prop', 'scene', 'style']

export const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  character: '角色',
  prop: '道具',
  scene: '场景',
  style: '风格',
}
