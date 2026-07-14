import type { Id, IsoDateTime } from './common'

export interface ShotAssetOverride {
  id: Id
  shotId: Id
  assetId: Id
  attributes: Record<string, unknown>
  createdAt: IsoDateTime
}
