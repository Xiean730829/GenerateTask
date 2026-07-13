import type { Id, IsoDateTime } from './common'

/**
 * 输入材料。MS1 固定为必填纯文本，不含文件上传。
 */
export interface SourceMaterial {
  id: Id
  episodeId: Id
  kind: 'text'
  text: string
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface UpdateSourceMaterialInput {
  text: string
}
