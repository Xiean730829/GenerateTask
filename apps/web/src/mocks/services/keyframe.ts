import type { KeyframeService } from '@/api/contracts'
import type { Id, Shot, ShotKeyframes } from '@/api/types'
import { getShotPromptReferences } from '@/api/prompt-references'
import { backend } from '@/mocks/backend'
import { generateKeyframes } from '@/mocks/backend/content'
import { clone, nowIso } from '@/mocks/backend/util'
import { invalidateForShot } from './invalidation'

/** 与工作台可见 Prompt 对齐：仅其引用的每类资产参与关键帧前置校验。 */
function promptAssetsForShot(shot: Shot) {
  return getShotPromptReferences(shot).map((reference) =>
    shot.materialAssetIds.map((assetId) => backend.db.userAssets.find((asset) => asset.id === assetId)).find(
      (asset) => asset?.kind === reference.kind && asset.name === reference.name,
    ),
  )
}

function ensureShotKeyframes(
  state: ReturnType<typeof backend.db.getEpisodeState>,
  shotId: Id,
): ShotKeyframes {
  let entry = state.keyframes.find((k) => k.shotId === shotId)
  if (!entry) {
    entry = { shotId, candidates: [], selectedKeyframeId: null, taskId: null }
    state.keyframes.push(entry)
  }
  return entry
}

function findShotEpisode(shotId: Id): Id {
  for (const state of backend.db.episodes.values()) {
    if (state.shots.some((s) => s.id === shotId)) return state.episode.id
  }
  throw new Error(`Shot 不存在：${shotId}`)
}

export const mockKeyframeService: KeyframeService = {
  async listByEpisode(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).keyframes)
  },

  async generateNextBatch(episodeId) {
    const state = backend.db.getEpisodeState(episodeId)
    const firstPending = state.shots.find((shot) => {
      const entry = ensureShotKeyframes(state, shot.id)
      return !entry.selectedKeyframeId
    })
    if (!firstPending) throw new Error('全部镜头都已确认关键帧')

    const remaining = state.shots.filter((shot) => shot.order >= firstPending.order)
    // 无论剩余镜头数是否达到 9，都只提交一张九宫格总图：尾部以空格补齐。
    const batch = remaining.slice(0, 9)
    for (const shot of batch) {
      const promptAssets = promptAssetsForShot(shot)
      const ready = promptAssets.every((asset) => asset?.imageStatus === 'confirmed')
      if (!ready) throw new Error(`镜头 ${shot.order} 的素材尚未全部确认，不能跳过前序镜头`)
    }

    const task = backend.engine.start({
      episodeId,
      taskType: 'keyframe.generate',
      onSucceed: () => {
        const current = backend.db.getEpisodeState(episodeId)
        for (const shot of batch) {
          const entry = ensureShotKeyframes(current, shot.id)
          entry.candidates = generateKeyframes(shot.id, shot.order + Math.floor(Math.random() * 99))
          entry.selectedKeyframeId = null
          entry.taskId = null
        }
        return {
          shotIds: batch.map((shot) => shot.id),
          mode: 'nine-grid',
          emptySlots: 9 - batch.length,
          // 真实服务在此返回一张九宫格总图并切割；Mock 已把切割结果回写到各 Shot。
          source: 'mock-nine-grid-split',
        }
      },
    })
    for (const shot of batch) ensureShotKeyframes(state, shot.id).taskId = task.taskId
    return { taskId: task.taskId, shotIds: batch.map((shot) => shot.id) }
  },

  async regenerate(shotId) {
    const episodeId = findShotEpisode(shotId)
    const state = backend.db.getEpisodeState(episodeId)
    const entry = ensureShotKeyframes(state, shotId)
    const task = backend.engine.start({
      episodeId,
      taskType: 'keyframe.generate',
      onSucceed: () => {
        const e = ensureShotKeyframes(backend.db.getEpisodeState(episodeId), shotId)
        e.candidates = generateKeyframes(shotId, Math.floor(Math.random() * 90) + 10)
        e.selectedKeyframeId = null
        e.taskId = null
        // 关键帧变化会使所属 Panel 视频失效。
        invalidateForShot(backend.db.getEpisodeState(episodeId), shotId)
        return { shotId }
      },
    })
    entry.taskId = task.taskId
    return { taskId: task.taskId }
  },

  async select(shotId, keyframeId) {
    const episodeId = findShotEpisode(shotId)
    const state = backend.db.getEpisodeState(episodeId)
    const entry = ensureShotKeyframes(state, shotId)
    if (!entry.candidates.some((c) => c.id === keyframeId)) {
      throw new Error(`关键帧不存在：${keyframeId}`)
    }
    entry.selectedKeyframeId = keyframeId
    invalidateForShot(state, shotId)
    void nowIso()
    return clone(entry)
  },
}
