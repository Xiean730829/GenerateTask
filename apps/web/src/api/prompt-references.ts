import type { AssetType, Shot } from './types'

export type PromptReference = { name: string; type: AssetType }

const CHARACTER_BY_SHOT_ORDER = ['林夏', '林夏', '林夏', '姐姐', '林夏', '林夏', '林夏']

function propByShotOrder(orderIndex: number): string | null {
  if (orderIndex <= 2) return '手机'
  if (orderIndex === 6) return '旧照片'
  return null
}

export function getShotPromptReferences(shot: Shot): PromptReference[] {
  const references: PromptReference[] = [
    { name: CHARACTER_BY_SHOT_ORDER[shot.orderIndex] ?? '林夏', type: 'character' },
    { name: shot.orderIndex <= 2 ? '出租屋' : shot.orderIndex <= 5 ? '天台' : '医院走廊', type: 'scene' },
  ]
  const prop = propByShotOrder(shot.orderIndex)
  if (prop) references.push({ name: prop, type: 'prop' })
  references.push({ name: '冷色胶片', type: 'style' })
  return references
}
