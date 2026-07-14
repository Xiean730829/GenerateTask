import type { Id, IsoDateTime } from './common'

export type ScriptStatus = 'draft' | 'confirmed'

/** 剧本，与 script.schema.json 对齐。生成中状态由 script.generate Task 表达。 */
export interface Script {
  id: Id
  episodeId: Id
  title: string | null
  logline: string | null
  content: string | null
  scenes: Record<string, unknown>[]
  version: number
  status: ScriptStatus
  confirmedAt: IsoDateTime | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface UpdateScriptInput {
  content: string
}
