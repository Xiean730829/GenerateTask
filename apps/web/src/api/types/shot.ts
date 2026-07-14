import type { Id, IsoDateTime } from './common'

/** 镜头，与 shot.schema.json 对齐。 */
export interface Shot {
  id: Id
  episodeId: Id
  scriptId: Id
  orderIndex: number
  durationSeconds: number | null
  shotSize: string | null
  characters: string[]
  action: string | null
  dialogue: string | null
  cameraMovement: string | null
  generationPrompt: string | null
  currentPromptRevisionId: Id | null
  status: string
  createdAt: IsoDateTime
}

export interface UpdateShotInput {
  durationSeconds?: number
  shotSize?: string | null
  cameraMovement?: string | null
  action?: string | null
  dialogue?: string | null
}
