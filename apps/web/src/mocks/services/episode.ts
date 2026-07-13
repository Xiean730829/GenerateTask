import type { EpisodeService } from '@/api/contracts'
import { backend } from '@/mocks/backend'
import { clone } from '@/mocks/backend/util'

export const mockEpisodeService: EpisodeService = {
  async get(episodeId) {
    return clone(backend.db.getEpisodeState(episodeId).episode)
  },
  async listByProject(projectId) {
    return [...backend.db.episodes.values()]
      .map((state) => state.episode)
      .filter((episode) => episode.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(clone)
  },
  async getVideoCapability() {
    // MS1 单一视频 API 能力；前端据此驱动组装与视频表单，不写死秒数。
    return clone(backend.db.videoCapability)
  },
}
