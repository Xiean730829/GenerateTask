import type { Id, IsoDateTime } from './common'

export type SourceMaterialType = 'text' | 'file'

/** 输入材料，与 source-material.schema.json 对齐。 */
export interface SourceMaterial {
  id: Id
  projectId: Id
  type: SourceMaterialType
  text: string | null
  title: string | null
  status: string
  createdAt: IsoDateTime
}

export interface UpdateSourceMaterialInput {
  text: string
  title?: string | null
}
