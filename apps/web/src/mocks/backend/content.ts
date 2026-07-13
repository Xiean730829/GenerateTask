// Mock 内容生成器：产出可读的剧本 / 镜头 / 资产 / 关键帧占位内容。
import type {
  Asset,
  CharacterAsset,
  Id,
  Keyframe,
  PropAsset,
  SceneAsset,
  Shot,
  StyleAsset,
} from '@/api/types'
import { mockId, nowIso } from './util'

export function generateScriptContent(sourceText: string): string {
  const seed = sourceText.trim().slice(0, 40) || '一个悬疑短剧'
  return [
    `【剧本 · 由输入材料生成】`,
    ``,
    `题材梗概：${seed}……`,
    ``,
    `第一场 内景 · 出租屋 · 夜`,
    `林夏盯着手机屏幕，来电显示是三年未联系的姐姐。`,
    `林夏（迟疑）：喂……是你？`,
    ``,
    `第二场 外景 · 天台 · 夜`,
    `冷风中，两姐妹隔着一米距离沉默对峙。`,
    `姐姐：有些话，我憋了三年。`,
    ``,
    `第三场 内景 · 医院走廊 · 日`,
    `真相揭开，林夏握紧了那张旧照片。`,
    `（本剧本可编辑，确认后进入镜头拆分）`,
  ].join('\n')
}

const SHOT_TEMPLATES: Array<Pick<Shot, 'size' | 'movement' | 'action' | 'dialogue' | 'durationSec'>> = [
  { size: 'medium', movement: 'static', action: '林夏低头看手机，来电闪烁。', dialogue: '喂……是你？', durationSec: 6 },
  { size: 'close-up', movement: 'zoom', action: '手机屏幕特写，姐姐的名字。', dialogue: '', durationSec: 4 },
  { size: 'wide', movement: 'pan', action: '天台全景，冷风吹动衣角。', dialogue: '', durationSec: 7 },
  { size: 'medium', movement: 'tracking', action: '姐姐缓缓走近。', dialogue: '有些话，我憋了三年。', durationSec: 8 },
  { size: 'close-up', movement: 'static', action: '林夏眼神动摇。', dialogue: '那你说吧。', durationSec: 5 },
  { size: 'full', movement: 'dolly', action: '医院走廊，两人并肩。', dialogue: '', durationSec: 9 },
  { size: 'extreme-close-up', movement: 'static', action: '旧照片被攥紧。', dialogue: '原来是这样……', durationSec: 6 },
]

export function generateShots(episodeId: Id): Shot[] {
  const ts = nowIso()
  return SHOT_TEMPLATES.map((tpl, i) => ({
    id: mockId('shot'),
    episodeId,
    order: i + 1,
    ...tpl,
    materialAssetIds: [],
    createdAt: ts,
    updatedAt: ts,
  }))
}

export function generateAssets(): Asset[] {
  const ts = nowIso()
  const base = {
    ownerId: 'demo-user', locked: false, taskId: null, version: 1,
    definitionStatus: 'draft' as const,
    imageStatus: 'not-generated' as const,
    imageCandidates: [], selectedImageUrl: null,
    createdAt: ts, updatedAt: ts,
  }
  const characters: CharacterAsset[] = [
    {
      ...base, id: mockId('asset'), kind: 'character', name: '林夏',
      description: '女主角，28 岁，外冷内热。',
      voice: { preset: '青年女声-清冷', speed: 1, pitch: 0 },
    },
    {
      ...base, id: mockId('asset'), kind: 'character', name: '姐姐',
      description: '林夏的姐姐，32 岁，隐忍。',
      voice: { preset: '成年女声-温沉', speed: 0.95, pitch: -1 },
    },
  ]
  const scenes: SceneAsset[] = [
    { ...base, id: mockId('asset'), kind: 'scene', name: '出租屋', description: '昏暗、局促的室内夜景。' },
    { ...base, id: mockId('asset'), kind: 'scene', name: '天台', description: '城市夜景，冷色调。' },
    { ...base, id: mockId('asset'), kind: 'scene', name: '医院走廊', description: '冷白光，安静。' },
  ]
  const props: PropAsset[] = [
    { ...base, id: mockId('asset'), kind: 'prop', name: '手机', description: '来电闪烁的智能手机，屏幕微亮。' },
    { ...base, id: mockId('asset'), kind: 'prop', name: '旧照片', description: '泛黄折角的老照片，握在手中。' },
  ]
  const styles: StyleAsset[] = [
    { ...base, id: mockId('asset'), kind: 'style', name: '冷色胶片', description: '低饱和、颗粒感、电影质感。' },
  ]
  return [...characters, ...props, ...scenes, ...styles]
}

/** 为某 Shot 生成单张关键帧；九宫格批次由服务把 9 个 Shot 一起提交。 */
export function generateKeyframes(shotId: Id, seed: number): Keyframe[] {
  const ts = nowIso()
  return Array.from({ length: 1 }, (_, i) => ({
    id: mockId('kf'),
    shotId,
    imageUrl: placeholderImage(seed + i),
    createdAt: ts,
  }))
}

/** Mock 的素材候选图数量只是能力演示；前端不依赖这个数量。 */
export function generateAssetImages(assetId: Id, seed: number): string[] {
  const count = seed % 2 === 0 ? 2 : 1
  return Array.from({ length: count }, (_, i) => placeholderAssetImage(assetId, seed + i))
}

function placeholderImage(seed: number): string {
  const hue = (seed * 47) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='320'><rect width='100%' height='100%' fill='hsl(${hue} 30% 22%)'/><text x='50%' y='50%' fill='hsl(${hue} 60% 70%)' font-size='18' text-anchor='middle' font-family='sans-serif'>KF ${seed}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function placeholderAssetImage(assetId: Id, seed: number): string {
  const hue = (seed * 61) % 360
  const label = assetId.slice(-5)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><rect width='100%' height='100%' fill='hsl(${hue} 32% 24%)'/><circle cx='120' cy='72' r='34' fill='hsl(${hue} 48% 42%)'/><text x='50%' y='138' fill='hsl(${hue} 70% 82%)' font-size='14' text-anchor='middle' font-family='sans-serif'>素材 ${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderVideoPoster(label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='#1f2937'/><polygon points='140,70 140,110 175,90' fill='#93c5fd'/><text x='50%' y='150' fill='#9ca3af' font-size='14' text-anchor='middle' font-family='sans-serif'>${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
