import type { Id, IsoDateTime } from './common'

export type AssetType = 'character' | 'prop' | 'scene' | 'style'

/** 角色音色，保存在 character Asset 的 attributes 中。 */
export interface VoiceAttributes {
  preset: string
  speed: number
  pitch: number
}

/** 素材，与 asset.schema.json 对齐。 */
export interface Asset {
  id: Id
  ownerUserId: Id
  type: AssetType
  name: string
  description: string | null
  referenceImageUrl: string | null
  currentRevisionId: Id | null
  attributes: Record<string, unknown>
  locked: boolean
  createdAt: IsoDateTime
}

export function getVoiceAttributes(asset: Asset): VoiceAttributes | null {
  if (asset.type !== 'character') return null
  const voice = asset.attributes.voice
  if (!voice || typeof voice !== 'object') return null
  const v = voice as Record<string, unknown>
  return {
    preset: String(v.preset ?? ''),
    speed: Number(v.speed ?? 1),
    pitch: Number(v.pitch ?? 0),
  }
}

export interface UpdateCharacterInput {
  name?: string
  description?: string | null
  voice?: Partial<VoiceAttributes>
}

export interface UpdateAssetInput {
  name?: string
  description?: string | null
}

export interface CreateAssetForShotInput {
  type: AssetType
  name: string
  description: string
}
