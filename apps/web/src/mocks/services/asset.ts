import type { AssetService } from '@/api/contracts'
import type { Asset, CharacterAsset, CreateAssetForShotInput, Id } from '@/api/types'
import { getShotPromptReferences } from '@/api/prompt-references'
import { backend } from '@/mocks/backend'
import { generateAssetImages, generateAssets } from '@/mocks/backend/content'
import { clone, mockId, nowIso } from '@/mocks/backend/util'
import { invalidateForShot } from './invalidation'

function findAsset(assetId: Id): Asset {
  const asset = backend.db.userAssets.find((item) => item.id === assetId)
  if (!asset) throw new Error(`素材不存在：${assetId}`)
  return asset
}

function findShot(shotId: Id) {
  for (const state of backend.db.episodes.values()) {
    const shot = state.shots.find((item) => item.id === shotId)
    if (shot) return { state, shot }
  }
  throw new Error(`镜头不存在：${shotId}`)
}

/**
 * Mock 中的“识别”以稳定模板模拟。重点是服务契约：每个镜头单独准备素材，
 * 但素材实体存在用户级库中，后续镜头将自动关联已确认的同名素材。
 */
function seedLibrary(): void {
  const defaults = generateAssets()
  if (backend.db.userAssets.length === 0) {
    backend.db.userAssets.push(...defaults)
    return
  }
  for (const asset of defaults) {
    const exists = backend.db.userAssets.some(
      (item) => item.kind === asset.kind && item.name === asset.name,
    )
    if (!exists) backend.db.userAssets.push(asset)
  }
}

export const mockAssetService: AssetService = {
  async listUserLibrary() {
    seedLibrary()
    return clone(backend.db.userAssets)
  },

  async listForShot(shotId) {
    const { shot } = findShot(shotId)
    return clone(shot.materialAssetIds.map(findAsset))
  },

  async prepareForShot(shotId) {
    const { state, shot } = findShot(shotId)
    const task = backend.engine.start({
      episodeId: state.episode.id,
      taskType: 'asset.extract',
      onSucceed: () => {
        seedLibrary()
        const ids = getShotPromptReferences(shot).map((requirement) => {
          const asset = backend.db.userAssets.find(
            (item) => item.kind === requirement.kind && item.name === requirement.name,
          )
          if (!asset) throw new Error('Mock 素材库初始化失败')
          return asset.id
        })
        shot.materialAssetIds = ids
        shot.updatedAt = nowIso()
        return { shotId, assetIds: ids }
      },
    })
    return { taskId: task.taskId }
  },

  async attachToShot(shotId, assetId) {
    const { state, shot } = findShot(shotId)
    findAsset(assetId)
    if (!shot.materialAssetIds.includes(assetId)) {
      shot.materialAssetIds.push(assetId)
      shot.updatedAt = nowIso()
      invalidateForShot(state, shotId)
    }
  },

  async detachFromShot(shotId, assetId) {
    const { state, shot } = findShot(shotId)
    shot.materialAssetIds = shot.materialAssetIds.filter((id) => id !== assetId)
    shot.updatedAt = nowIso()
    invalidateForShot(state, shotId)
  },

  async createForShot(shotId, input) {
    const { state, shot } = findShot(shotId)
    const ts = nowIso()
    const base = {
      id: mockId('asset'), ownerId: 'demo-user', kind: input.kind, name: input.name,
      description: input.description, locked: false, taskId: null, version: 1,
      definitionStatus: 'draft' as const,
      imageStatus: 'not-generated' as const,
      imageCandidates: [], selectedImageUrl: null, createdAt: ts, updatedAt: ts,
    }
    const asset: Asset = input.kind === 'character'
      ? { ...base, kind: 'character', voice: { preset: '青年女声-清冷', speed: 1, pitch: 0 } }
      : input.kind === 'scene'
        ? { ...base, kind: 'scene' }
        : input.kind === 'prop'
          ? { ...base, kind: 'prop' }
          : { ...base, kind: 'style' }
    backend.db.userAssets.push(asset)
    shot.materialAssetIds.push(asset.id)
    shot.updatedAt = ts
    invalidateForShot(state, shotId)
    return clone(asset)
  },

  async updateCharacter(id, input) {
    const asset = findAsset(id)
    if (asset.kind !== 'character') throw new Error(`素材 ${id} 不是角色`)
    const character = asset as CharacterAsset
    if (input.name !== undefined) character.name = input.name
    if (input.description !== undefined) character.description = input.description
    if (input.voice) character.voice = { ...character.voice, ...input.voice }
    character.updatedAt = nowIso()
    return clone(character)
  },

  async update(id, input) {
    const asset = findAsset(id)
    if (input.name !== undefined) asset.name = input.name
    if (input.description !== undefined) asset.description = input.description
    asset.updatedAt = nowIso()
    return clone(asset)
  },

  async confirmDefinition(id) {
    const asset = findAsset(id)
    asset.definitionStatus = 'confirmed'
    asset.updatedAt = nowIso()
    return clone(asset)
  },

  async generateImage(id) {
    const asset = findAsset(id)
    if (asset.definitionStatus !== 'confirmed') throw new Error('请先确认素材文字定义')
    const task = backend.engine.start({
      episodeId: firstRelatedEpisodeId(id),
      taskType: 'asset.image.generate',
      onSucceed: () => {
        const current = findAsset(id)
        current.imageCandidates = generateAssetImages(id, current.version + current.name.length)
        current.imageStatus = 'awaiting-confirmation'
        current.taskId = null
        current.updatedAt = nowIso()
        return { assetId: id, count: current.imageCandidates.length }
      },
    })
    asset.imageStatus = 'generating'
    asset.taskId = task.taskId
    asset.updatedAt = nowIso()
    return { taskId: task.taskId }
  },

  async confirmImage(id, imageUrl) {
    const asset = findAsset(id)
    if (!asset.imageCandidates.includes(imageUrl)) throw new Error('素材候选图不存在')
    asset.selectedImageUrl = imageUrl
    asset.imageStatus = 'confirmed'
    asset.locked = true
    asset.updatedAt = nowIso()
    return clone(asset)
  },
}

function firstRelatedEpisodeId(assetId: Id): Id {
  for (const state of backend.db.episodes.values()) {
    if (state.shots.some((shot) => shot.materialAssetIds.includes(assetId))) return state.episode.id
  }
  throw new Error(`没有镜头关联素材：${assetId}`)
}
