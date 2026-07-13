import type { AspectRatio, Id, IsoDateTime } from './common'

/**
 * 单集快创项目。MS1 中一个 Project 只含一个默认 Episode。
 */
export interface Project {
  id: Id
  name: string
  /** 目标时长（秒），默认 45。 */
  targetDurationSec: number
  aspectRatio: AspectRatio
  /** 视觉风格，可选。 */
  visualStyle: string | null
  /** 默认 Episode 的 id，创建项目时一并生成。 */
  defaultEpisodeId: Id
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** 项目首页“最近项目”摘要。 */
export interface ProjectSummary {
  id: Id
  name: string
  aspectRatio: AspectRatio
  defaultEpisodeId: Id
  updatedAt: IsoDateTime
  /** 当前所处生产阶段的可读标签，用于首页展示。 */
  stageLabel: string
}

/** 创建单集项目的入参（对应本地创作草稿提交）。 */
export interface CreateProjectInput {
  name: string
  sourceText: string
  targetDurationSec: number
  aspectRatio: AspectRatio
  visualStyle: string | null
}

/** 创建项目后返回的初始上下文：项目、默认 Episode 与剧本任务。 */
export interface CreateProjectResult {
  project: Project
  episodeId: Id
  sourceMaterialId: Id
  /** 已创建的剧本生成任务 id。 */
  scriptTaskId: Id
}
