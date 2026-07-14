import type { Id, IsoDateTime } from './common'

export interface AssetRevision {
  id: Id
  assetId: Id
  revisionNo: number
  attributes: Record<string, unknown>
  createdAt: IsoDateTime
}
