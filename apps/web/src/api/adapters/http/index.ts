// 真实 Java API adapter：薄 HTTP 实现，仅 envelope 解包与少量 REST 组合。
import type { ApiClient } from '@/api/contracts'
import { createHttpClient } from './client'
import { createHttpEventSource } from './event-source'
import {
  createHttpAssets,
  createHttpEpisodes,
  createHttpExports,
  createHttpKeyframes,
  createHttpPanels,
  createHttpPanelVideos,
  createHttpProjects,
  createHttpScripts,
  createHttpShots,
  createHttpSourceMaterials,
  createHttpTasks,
  createHttpTimelines,
} from './services'

export interface HttpApiConfig {
  baseUrl: string
  wsBaseUrl: string
}

export function createHttpApiClient(config: HttpApiConfig): ApiClient {
  const http = createHttpClient(config.baseUrl)
  return {
    projects: createHttpProjects(http),
    episodes: createHttpEpisodes(http),
    sourceMaterials: createHttpSourceMaterials(http),
    scripts: createHttpScripts(http),
    shots: createHttpShots(http),
    assets: createHttpAssets(http),
    keyframes: createHttpKeyframes(http),
    panels: createHttpPanels(http),
    panelVideos: createHttpPanelVideos(http),
    timelines: createHttpTimelines(http),
    exports: createHttpExports(http),
    tasks: createHttpTasks(http),
    taskEvents: createHttpEventSource(config.wsBaseUrl),
  }
}
