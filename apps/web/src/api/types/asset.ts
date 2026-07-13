import type { Id, IsoDateTime } from './common'

/** Asset 分类：角色、道具、场景、风格。音色不是独立分类。 */
export type AssetKind = 'character' | 'prop' | 'scene' | 'style'

interface AssetBase {
  id: Id
  /** 单一演示用户的素材库。真实服务中由登录用户决定，不由 Episode 隔离。 */
  ownerId: Id
  kind: AssetKind
  name: string
  description: string
  /** 是否已锁定；素材确认即锁定角色 / 道具 / 场景 / 风格。 */
  locked: boolean
  taskId: Id | null
  /** 已确认素材的版本不可原地覆写；修改会创建一个新版本。 */
  version: number
  /** 文字定义与最终素材图是两次独立确认。 */
  definitionStatus: 'draft' | 'confirmed'
  imageStatus: 'not-generated' | 'generating' | 'awaiting-confirmation' | 'confirmed'
  imageCandidates: string[]
  selectedImageUrl: string | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/**
 * 角色资产。音色是其字段（随角色锁定），不建立独立音色库。
 */
export interface CharacterAsset extends AssetBase {
  kind: 'character'
  /** 音色配置，作为角色字段可编辑。 */
  voice: VoiceProfile
}

export interface SceneAsset extends AssetBase {
  kind: 'scene'
}

export interface PropAsset extends AssetBase {
  kind: 'prop'
}

export interface StyleAsset extends AssetBase {
  kind: 'style'
}

export type Asset = CharacterAsset | PropAsset | SceneAsset | StyleAsset

/** 音色特征，仅作为角色字段存在。 */
export interface VoiceProfile {
  /** 音色预设名，如“青年男声-沉稳”。 */
  preset: string
  /** 语速，0.5–2.0。 */
  speed: number
  /** 音调，-12–12 半音。 */
  pitch: number
}

/** 更新角色（含音色字段）。 */
export interface UpdateCharacterInput {
  name?: string
  description?: string
  voice?: Partial<VoiceProfile>
}

export interface UpdateAssetInput {
  name?: string
  description?: string
}

/** 在当前镜头内新建并关联的用户级素材定义。 */
export interface CreateAssetForShotInput {
  kind: AssetKind
  name: string
  description: string
}
