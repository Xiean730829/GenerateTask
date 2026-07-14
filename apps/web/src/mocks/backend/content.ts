import type { Asset, Id, Keyframe, Shot } from '@/api/types'
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

const SHOT_TEMPLATES: Array<{
  shotSize: string
  cameraMovement: string
  action: string
  dialogue: string
  durationSeconds: number
  characters: string[]
}> = [
  { shotSize: 'medium', cameraMovement: 'static', action: '林夏低头看手机，来电闪烁。', dialogue: '喂……是你？', durationSeconds: 6, characters: ['林夏'] },
  { shotSize: 'close-up', cameraMovement: 'zoom', action: '手机屏幕特写，姐姐的名字。', dialogue: '', durationSeconds: 4, characters: ['林夏'] },
  { shotSize: 'wide', cameraMovement: 'pan', action: '天台全景，冷风吹动衣角。', dialogue: '', durationSeconds: 7, characters: ['林夏'] },
  { shotSize: 'medium', cameraMovement: 'tracking', action: '姐姐缓缓走近。', dialogue: '有些话，我憋了三年。', durationSeconds: 8, characters: ['姐姐'] },
  { shotSize: 'close-up', cameraMovement: 'static', action: '林夏眼神动摇。', dialogue: '那你说吧。', durationSeconds: 5, characters: ['林夏'] },
  { shotSize: 'full', cameraMovement: 'dolly', action: '医院走廊，两人并肩。', dialogue: '', durationSeconds: 9, characters: ['林夏', '姐姐'] },
  { shotSize: 'extreme-close-up', cameraMovement: 'static', action: '旧照片被攥紧。', dialogue: '原来是这样……', durationSeconds: 6, characters: ['林夏'] },
]

export function generateShots(episodeId: Id, scriptId: Id): Shot[] {
  const ts = nowIso()
  return SHOT_TEMPLATES.map((tpl, i) => ({
    id: mockId('shot'),
    episodeId,
    scriptId,
    orderIndex: i,
    durationSeconds: tpl.durationSeconds,
    shotSize: tpl.shotSize,
    characters: tpl.characters,
    action: tpl.action,
    dialogue: tpl.dialogue,
    cameraMovement: tpl.cameraMovement,
    generationPrompt: null,
    currentPromptRevisionId: null,
    status: 'ready',
    createdAt: ts,
  }))
}

export function generateAssets(): Asset[] {
  const ts = nowIso()
  const ownerUserId = 'demo-user'
  const base = {
    ownerUserId,
    locked: false,
    currentRevisionId: null,
    referenceImageUrl: null,
    attributes: {},
    createdAt: ts,
  }
  return [
    {
      ...base,
      id: mockId('asset'),
      type: 'character' as const,
      name: '林夏',
      description: '女主角，28 岁，外冷内热。',
      attributes: { voice: { preset: '青年女声-清冷', speed: 1, pitch: 0 } },
    },
    {
      ...base,
      id: mockId('asset'),
      type: 'character' as const,
      name: '姐姐',
      description: '林夏的姐姐，32 岁，隐忍。',
      attributes: { voice: { preset: '成年女声-温沉', speed: 0.95, pitch: -1 } },
    },
    { ...base, id: mockId('asset'), type: 'scene' as const, name: '出租屋', description: '昏暗、局促的室内夜景。' },
    { ...base, id: mockId('asset'), type: 'scene' as const, name: '天台', description: '城市夜景，冷色调。' },
    { ...base, id: mockId('asset'), type: 'scene' as const, name: '医院走廊', description: '冷白光，安静。' },
    { ...base, id: mockId('asset'), type: 'prop' as const, name: '手机', description: '来电闪烁的智能手机。' },
    { ...base, id: mockId('asset'), type: 'prop' as const, name: '旧照片', description: '泛黄折角的老照片。' },
    { ...base, id: mockId('asset'), type: 'style' as const, name: '冷色胶片', description: '低饱和、颗粒感、电影质感。' },
  ]
}

export function generateKeyframes(shotId: Id, seed: number): Keyframe[] {
  const ts = nowIso()
  const mediaFileId = mockId('media')
  return [{
    id: mockId('kf'),
    shotId,
    mediaFileId,
    status: 'candidate',
    promptRevisionId: null,
    createdAt: ts,
    _seed: seed,
  } as Keyframe & { _seed: number }]
}

export function mediaUrlFor(mediaFileId: Id, seed = 0): string {
  const hue = (seed * 47) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='320'><rect width='100%' height='100%' fill='hsl(${hue} 30% 22%)'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderAssetImage(assetId: Id, seed: number): string {
  const hue = (seed * 61) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='160'><rect width='100%' height='100%' fill='hsl(${hue} 32% 24%)'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderVideoPoster(label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='#1f2937'/><text x='50%' y='90' fill='#9ca3af' font-size='14' text-anchor='middle'>${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function generateProjectCover(seed: number): string {
  const hue = (seed * 53) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='hsl(${hue} 42% 32%)'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
