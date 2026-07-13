// 统一 adapter 选择入口。
// 由 VITE_API_MODE 决定数据源；当前默认 mock（后端尚未实现）。
// 未来接入 Java 后端时，只切换到 http adapter，页面与业务状态无需改写。
import { createHttpApiClient } from '@/api/adapters/http'
import { createMockApiClient } from '@/mocks'
import type { ApiClient } from '@/api/contracts'

export type ApiMode = 'mock' | 'api'

export const apiMode: ApiMode =
  (import.meta.env.VITE_API_MODE as ApiMode) === 'api' ? 'api' : 'mock'

export const isMockMode = apiMode === 'mock'

function createClient(): ApiClient {
  if (apiMode === 'api') {
    return createHttpApiClient({
      baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
      wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? '/api/ws',
    })
  }
  return createMockApiClient()
}

/** 全局单例业务客户端。页面与 store 只从这里访问后端能力。 */
export const api: ApiClient = createClient()

export * from '@/api/types'
export type {
  ApiClient,
  EpisodeTaskEventSource,
  ConnectionState,
} from '@/api/contracts'
