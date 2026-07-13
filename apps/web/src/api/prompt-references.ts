import type { Asset, Shot } from './types'

/**
 * MS1 的 Prompt 由既有 Shot 结构化字段生成。
 * 这份引用清单不能依赖素材识别结果，否则识别前后会改变用户看到的 Prompt。
 */
export type PromptReference = { name: string; kind: Asset['kind'] }

const CHARACTER_BY_SHOT_ORDER = ['林夏', '林夏', '林夏', '姐姐', '林夏', '林夏', '林夏']

function propByShotOrder(order: number): string | null {
  if (order <= 2) return '手机'
  if (order === 7) return '旧照片'
  return null
}

/** 引用顺序固定为：角色 → 场景 → 道具（可选）→ 风格。 */
export function getShotPromptReferences(shot: Shot): PromptReference[] {
  const references: PromptReference[] = [
    { name: CHARACTER_BY_SHOT_ORDER[shot.order - 1] ?? '林夏', kind: 'character' },
    { name: shot.order <= 2 ? '出租屋' : shot.order <= 5 ? '天台' : '医院走廊', kind: 'scene' },
  ]
  const prop = propByShotOrder(shot.order)
  if (prop) references.push({ name: prop, kind: 'prop' })
  references.push({ name: '冷色胶片', kind: 'style' })
  return references
}
