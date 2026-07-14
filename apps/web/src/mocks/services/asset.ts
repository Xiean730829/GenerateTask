import type { AssetService } from '@/api/contracts'
import type { Asset, CreateAssetForShotInput, Id } from '@/api/types'
import { getShotPromptReferences } from '@/api/prompt-references'
import { backend } from '@/mocks/backend'
import { generateAssets, placeholderAssetImage } from '@/mocks/backend/content'
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

function seedLibrary(): void {
  const defaults = generateAssets()
  if (backend.db.userAssets.length === 0) {
    backend.db.userAssets.push(...defaults)
    return
  }
  for (const asset of defaults) {
    const exists = backend.db.userAssets.some((item) => item.type === asset.type && item.name === asset.name)
    if (!exists) backend.db.userAssets.push(asset)
  }
}

function listAssetsForShot(shotId: Id): Asset[] {
  const { state } = findShot(shotId)
  const assetIds = state.shotAssetOverrides
    .filter((o) => o.shotId === shotId)
    .map((o) => o.assetId)
  return assetIds.map(findAsset)
}

function attachOverride(state: ReturnType<typeof findShot>['state'], shotId: Id, assetId: Id): void {
  if (!state.shotAssetOverrides.some((o) => o.shotId === shotId && o.assetId === assetId)) {
    state.shotAssetOverrides.push({
      id: mockId('sao'),
      shotId,
      assetId,
      attributes: {},
      createdAt: nowIso(),
    })
  }
}

export const mockAssetService: AssetService = {
  async listUserLibrary() {
    seedLibrary()
    return clone(backend.db.userAssets)
  },

  async listForShot(shotId) {
    seedLibrary()
    return clone(listAssetsForShot(shotId))
  },

  async prepareForShot(shotId) {
    const { state, shot } = findShot(shotId)
    const task = backend.engine.start({
      episodeId: state.episode.id,
      taskType: 'asset.extract',
      onSucceed: () => {
        seedLibrary()
        const refs = getShotPromptReferences(shot)
        const ids = refs.map((req) => {
          const asset = backend.db.userAssets.find((item) => item.type === req.type && item.name === req.name)
          if (!asset) throw new Error('Mock 素材库初始化失败')
          attachOverride(state, shotId, asset.id)
          return asset.id
        })
        return { shotId, assetIds: ids }
      },
    })
    return { taskId: task.id }
  },

  async attachToShot(shotId, assetId) {
    const { state } = findShot(shotId)
    findAsset(assetId)
    attachOverride(state, shotId, assetId)
    invalidateForShot(state, shotId)
  },

  async detachFromShot(shotId, assetId) {
    const { state } = findShot(shotId)
    state.shotAssetOverrides = state.shotAssetOverrides.filter(
      (o) => !(o.shotId === shotId && o.assetId === assetId),
    )
    invalidateForShot(state, shotId)
  },

  async createForShot(shotId, input: CreateAssetForShotInput) {
    const { state } = findShot(shotId)
    const ts = nowIso()
    const asset: Asset = {
      id: mockId('asset'),
      ownerUserId: 'demo-user',
      type: input.type,
      name: input.name,
      description: input.description,
      referenceImageUrl: null,
      currentRevisionId: null,
      attributes: input.type === 'character' ? { voice: { preset: '青年女声', speed: 1, pitch: 0 } } : {},
      locked: false,
      createdAt: ts,
    }
    backend.db.userAssets.push(asset)
    attachOverride(state, shotId, asset.id)
    invalidateForShot(state, shotId)
    return clone(asset)
  },

  async updateCharacter(id, input) {
    const asset = findAsset(id)
    if (input.name !== undefined) asset.name = input.name
    if (input.description !== undefined) asset.description = input.description
    if (input.voice) {
      const voice = (asset.attributes.voice ?? {}) as Record<string, unknown>
      asset.attributes = { ...asset.attributes, voice: { ...voice, ...input.voice } }
    }
    return clone(asset)
  },

  async update(id, input) {
    const asset = findAsset(id)
    if (input.name !== undefined) asset.name = input.name
    if (input.description !== undefined) asset.description = input.description
    return clone(asset)
  },

  async createRevision(id) {
    const asset = findAsset(id)
    const revisionId = mockId('arev')
    asset.currentRevisionId = revisionId
    asset.locked = true
    return clone(asset)
  },

  async generateReferenceImage(id) {
    const asset = findAsset(id)
    const { state } = [...backend.db.episodes.values()]
      .map((s) => ({ state: s, shot: s.shots[0] }))
      .find((x) => x.state.shotAssetOverrides.some((o) => o.assetId === id)) ?? { state: backend.db.episodes.values().next().value!, shot: null }
    const task = backend.engine.start({
      episodeId: state.episode.id,
      taskType: 'asset.image.generate',
      onSucceed: () => {
        const url = placeholderAssetImage(id, 1)
        asset.referenceImageUrl = url
        return { assetId: id }
      },
    })
    return { taskId: task.id }
  },

  async confirmReferenceImage(id, mediaFileId) {
    const asset = findAsset(id)
    asset.referenceImageUrl = backend.db.mediaUrls.get(mediaFileId) ?? placeholderAssetImage(id, 2)
    return clone(asset)
  },
}
