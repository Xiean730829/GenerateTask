/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 数据源模式：mock（默认）| api。 */
  readonly VITE_API_MODE?: 'mock' | 'api'
  /** 真实模式 REST 基址。 */
  readonly VITE_API_BASE_URL?: string
  /** 真实模式 WebSocket 基址。 */
  readonly VITE_WS_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
