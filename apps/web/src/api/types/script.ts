import type { Id, IsoDateTime } from './common'

/** 剧本状态：生成中 / 可编辑 / 已确认。 */
export type ScriptStatus = 'generating' | 'ready' | 'confirmed'

/**
 * Script 由剧本任务产出，成功后停在可编辑结果。
 * 用户确认后才允许创建镜头任务。
 */
export interface Script {
  id: Id
  episodeId: Id
  status: ScriptStatus
  /** 剧本正文（可编辑）。 */
  content: string
  /** 关联的生成任务 id，用于就地展示状态。 */
  taskId: Id | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface UpdateScriptInput {
  content: string
}
