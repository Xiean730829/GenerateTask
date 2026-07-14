import type { Project } from '@/api/types'
import type { EpisodeState } from '@/mocks/backend/db'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { generateProjectCover } from '@/mocks/backend/content'
import { mediaUrlFromId } from '@/lib/media-url'
import { SEED_PROJECT_COVERS } from '@/mocks/backend/seed'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function isDevKeyframePlaceholder(url: string): boolean {
  return url.startsWith('data:image/svg+xml')
}

/** 优先用演示封面 / 已选关键帧，否则回退到项目封面占位图。 */
export function deriveProjectCover(project: Project, state: EpisodeState): string {
  const seedCover = SEED_PROJECT_COVERS[project.id]
  if (seedCover) return seedCover

  for (const entry of groupKeyframesByShot(state.keyframes)) {
    const selected = entry.candidates.find((candidate) => candidate.id === entry.selectedKeyframeId)
    if (selected) {
      const url = mediaUrlFromId(selected.mediaFileId)
      if (!isDevKeyframePlaceholder(url)) return url
    }
  }

  const firstCandidate = state.keyframes[0]
  if (firstCandidate) {
    const url = mediaUrlFromId(firstCandidate.mediaFileId)
    if (!isDevKeyframePlaceholder(url)) return url
  }

  return generateProjectCover(hashString(project.id))
}
