import type { ExportService } from '@/api/contracts'
import type { Export } from '@/api/types'
import { backend } from '@/mocks/backend'
import { clone, mockId, nowIso } from '@/mocks/backend/util'

export const mockExportService: ExportService = {
  async getByEpisode(episodeId) {
    const record = backend.db.getEpisodeState(episodeId).exportRecord
    return record ? clone(record) : null
  },

  async create(episodeId, options) {
    const state = backend.db.getEpisodeState(episodeId)
    if (!state.timeline) throw new Error('请先合成时间线')
    const ts = nowIso()
    const record: Export = {
      id: mockId('exp'),
      timelineId: state.timeline.id,
      taskId: null,
      status: 'running',
      fileUrl: null,
      objectKey: null,
      format: options.format,
      resolution: options.resolution,
      durationSeconds: state.timeline.videoTrack.reduce((s, c) => s + c.durationSeconds, 0),
      sizeBytes: null,
      createdAt: ts,
      finishedAt: null,
    }
    state.exportRecord = record
    const task = backend.engine.start({
      episodeId,
      taskType: 'export.compose',
      onSucceed: () => {
        const s = backend.db.getEpisodeState(episodeId)
        if (s.exportRecord) {
          s.exportRecord.status = 'succeeded'
          s.exportRecord.fileUrl = `mock://export/${s.exportRecord.id}.${options.format}`
          s.exportRecord.finishedAt = nowIso()
        }
        return { exportId: record.id }
      },
      onFail: () => {
        const s = backend.db.getEpisodeState(episodeId)
        if (s.exportRecord) s.exportRecord.status = 'failed'
      },
    })
    record.taskId = task.id
    return { taskId: task.id }
  },
}
