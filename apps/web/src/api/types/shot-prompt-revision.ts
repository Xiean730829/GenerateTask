import type { Id, IsoDateTime } from './common'
import type { ShotAssetOverride } from './shot-asset-override'

export type ShotPromptSource = 'generated' | 'manual' | 'assistant'

export interface ShotPromptRevision {
  id: Id
  shotId: Id
  revisionNo: number
  prompt: string
  source: ShotPromptSource
  assetReferenceIds: Id[]
  assetOverrides: ShotAssetOverride[]
  createdAt: IsoDateTime
}
