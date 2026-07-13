// 真实 Java API adapter：typed placeholder。
// MS1 默认使用 mock；此处保留可编译骨架，未来接入后端时只替换本目录，不改页面与业务状态。
import type { ApiClient } from '@/api/contracts'
import { createHttpEventSource } from './event-source'
import { notImplemented } from './not-implemented'

/**
 * 真实模式下应从环境读取；此处提供默认值，接入后端时按部署调整。
 */
export interface HttpApiConfig {
  /** REST 基址，例如 /api。 */
  baseUrl: string
  /** WebSocket 基址，例如 /api/ws。 */
  wsBaseUrl: string
}

export function createHttpApiClient(config: HttpApiConfig): ApiClient {
  // 说明：以下服务方法均为占位，真实实现应发起对应 REST 调用并按契约返回类型。
  // 任务事件源已给出真实的原生 JSON WebSocket 实现，可直接复用。
  return {
    projects: {
      listRecent: () => notImplemented('projects.listRecent'),
      get: () => notImplemented('projects.get'),
      create: () => notImplemented('projects.create'),
    },
    episodes: {
      get: () => notImplemented('episodes.get'),
      listByProject: () => notImplemented('episodes.listByProject'),
      getVideoCapability: () => notImplemented('episodes.getVideoCapability'),
    },
    sourceMaterials: {
      getByEpisode: () => notImplemented('sourceMaterials.getByEpisode'),
      update: () => notImplemented('sourceMaterials.update'),
    },
    scripts: {
      getByEpisode: () => notImplemented('scripts.getByEpisode'),
      update: () => notImplemented('scripts.update'),
      confirmAndGenerateShots: () =>
        notImplemented('scripts.confirmAndGenerateShots'),
    },
    shots: {
      listByEpisode: () => notImplemented('shots.listByEpisode'),
      update: () => notImplemented('shots.update'),
    },
    assets: {
      listUserLibrary: () => notImplemented('assets.listUserLibrary'),
      listForShot: () => notImplemented('assets.listForShot'),
      prepareForShot: () => notImplemented('assets.prepareForShot'),
      attachToShot: () => notImplemented('assets.attachToShot'),
      detachFromShot: () => notImplemented('assets.detachFromShot'),
      createForShot: () => notImplemented('assets.createForShot'),
      updateCharacter: () => notImplemented('assets.updateCharacter'),
      update: () => notImplemented('assets.update'),
      confirmDefinition: () => notImplemented('assets.confirmDefinition'),
      generateImage: () => notImplemented('assets.generateImage'),
      confirmImage: () => notImplemented('assets.confirmImage'),
    },
    keyframes: {
      listByEpisode: () => notImplemented('keyframes.listByEpisode'),
      generateNextBatch: () => notImplemented('keyframes.generateNextBatch'),
      regenerate: () => notImplemented('keyframes.regenerate'),
      select: () => notImplemented('keyframes.select'),
    },
    panels: {
      listByEpisode: () => notImplemented('panels.listByEpisode'),
      assemble: () => notImplemented('panels.assemble'),
    },
    panelVideos: {
      listByEpisode: () => notImplemented('panelVideos.listByEpisode'),
      generate: () => notImplemented('panelVideos.generate'),
      generateBatch: () => notImplemented('panelVideos.generateBatch'),
    },
    timelines: {
      getByEpisode: () => notImplemented('timelines.getByEpisode'),
      compose: () => notImplemented('timelines.compose'),
    },
    exports: {
      getByEpisode: () => notImplemented('exports.getByEpisode'),
      estimate: () => notImplemented('exports.estimate'),
      create: () => notImplemented('exports.create'),
    },
    tasks: {
      listByEpisode: () => notImplemented('tasks.listByEpisode'),
      get: () => notImplemented('tasks.get'),
      cancel: () => notImplemented('tasks.cancel'),
      retry: () => notImplemented('tasks.retry'),
    },
    taskEvents: createHttpEventSource(config.wsBaseUrl),
  }
}
