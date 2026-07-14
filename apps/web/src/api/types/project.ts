import type { Id, IsoDateTime } from './common'

export type ProjectType = 'single_episode' | 'full_series'

export type ProjectStage =
  | 'material'
  | 'script'
  | 'shot'
  | 'asset'
  | 'panel'
  | 'video'
  | 'audio'
  | 'timeline'
  | 'export'

/** 项目实体，与 project.schema.json 对齐。 */
export interface Project {
  id: Id
  ownerUserId: Id
  name: string
  projectType: ProjectType
  stage: ProjectStage
  targetDurationSeconds: number | null
  aspectRatio: string | null
  style: string | null
  defaultEpisodeId: Id
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** 首页卡片摘要：REST Project + 前端派生展示字段。 */
export interface ProjectSummary {
  id: Id
  name: string
  aspectRatio: string | null
  defaultEpisodeId: Id
  updatedAt: IsoDateTime
  stageLabel: string
  coverUrl: string
}

export interface CreateProjectInput {
  name: string
  sourceText: string
  targetDurationSeconds: number
  aspectRatio: string
  style: string | null
}

/** 创建项目结果：契约 CreateProjectResult + 可选剧本任务 id（Mock/组合 REST）。 */
export interface CreateProjectResult {
  project: Project
  defaultEpisode: import('./episode').Episode
  sourceMaterial: import('./source-material').SourceMaterial | null
  scriptTaskId?: Id
}
