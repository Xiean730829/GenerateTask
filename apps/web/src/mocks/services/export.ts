import type { ExportService } from '@/api/contracts'
import type { ExportJob } from '@/api/types'
import { backend } from '@/mocks/backend'
import { clone, mockId, nowIso } from '@/mocks/backend/util'

const COST_PER_SEC: Record<string, number> = { '480p': 1, '720p': 2, '1080p': 4 }

export const mockExportService: ExportService = {
  async getByEpisode(episodeId) {
    const job = backend.db.getEpisodeState(episodeId).exportJob
    return job ? clone(job) : null
  },

  async estimate(episodeId, options) {
    const state = backend.db.getEpisodeState(episodeId)
    const durationSec = state.timeline?.totalDurationSec ?? 0
    const rate = COST_PER_SEC[options.resolution] ?? 2
    return {
      options,
      durationSec,
      estimatedCost: durationSec * rate,
      currency: '积分',
    }
  },

  async create(episodeId, options) {
    const state = backend.db.getEpisodeState(episodeId)
    const ts = nowIso()
    const job: ExportJob = {
      id: mockId('exp'),
      episodeId,
      options,
      status: 'rendering',
      downloadUrl: null,
      taskId: null,
      createdAt: ts,
      updatedAt: ts,
    }
    state.exportJob = job
    const task = backend.engine.start({
      episodeId,
      taskType: 'export.render',
      onSucceed: () => {
        const s = backend.db.getEpisodeState(episodeId)
        if (s.exportJob) {
          s.exportJob.status = 'ready'
          s.exportJob.downloadUrl = `mock://export/${s.exportJob.id}.${options.format}`
          s.exportJob.updatedAt = nowIso()
        }
        return { exportId: job.id }
      },
      onFail: () => {
        const s = backend.db.getEpisodeState(episodeId)
        if (s.exportJob) {
          s.exportJob.status = 'failed'
          s.exportJob.updatedAt = nowIso()
        }
      },
    })
    job.taskId = task.taskId
    return { taskId: task.taskId }
  },
}
