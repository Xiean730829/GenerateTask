import type { ProjectService } from '@/api/contracts'
import type {
  CreateProjectInput,
  CreateProjectResult,
  Episode,
  Project,
  Script,
  SourceMaterial,
} from '@/api/types'
import { backend } from '@/mocks/backend'
import { generateScriptContent } from '@/mocks/backend/content'
import { clone, mockId, nowIso } from '@/mocks/backend/util'
import { deriveStageLabel } from './stage-label'

export const mockProjectService: ProjectService = {
  async listRecent() {
    return backend.db.recentProjectIds.map((pid) => {
      const project = backend.db.getProject(pid)
      const state = backend.db.getEpisodeState(project.defaultEpisodeId)
      return {
        id: project.id,
        name: project.name,
        aspectRatio: project.aspectRatio,
        defaultEpisodeId: project.defaultEpisodeId,
        updatedAt: project.updatedAt,
        stageLabel: deriveStageLabel(state),
      }
    })
  },

  async get(projectId) {
    return clone(backend.db.getProject(projectId))
  },

  async create(input: CreateProjectInput): Promise<CreateProjectResult> {
    const ts = nowIso()
    const projectId = mockId('proj')
    const episodeId = mockId('ep')

    const episode: Episode = {
      id: episodeId,
      projectId,
      title: '第 1 集',
      createdAt: ts,
      updatedAt: ts,
    }
    const project: Project = {
      id: projectId,
      name: input.name,
      targetDurationSec: input.targetDurationSec,
      aspectRatio: input.aspectRatio,
      visualStyle: input.visualStyle,
      defaultEpisodeId: episodeId,
      createdAt: ts,
      updatedAt: ts,
    }
    const sourceMaterial: SourceMaterial = {
      id: mockId('src'),
      episodeId,
      kind: 'text',
      text: input.sourceText,
      createdAt: ts,
      updatedAt: ts,
    }
    const script: Script = {
      id: mockId('script'),
      episodeId,
      status: 'generating',
      content: '',
      taskId: null,
      createdAt: ts,
      updatedAt: ts,
    }

    backend.db.projects.set(projectId, project)
    backend.db.episodes.set(episodeId, {
      episode,
      sourceMaterial,
      script,
      shots: [],
      keyframes: [],
      panels: [],
      panelVideos: [],
      timeline: null,
      exportJob: null,
      failedOnce: new Set(),
    })
    backend.db.touchRecent(projectId)

    // 创建剧本生成任务；成功后写入剧本正文并置为 ready。
    const task = backend.engine.start({
      episodeId,
      taskType: 'script.generate',
      onSucceed: () => {
        const state = backend.db.getEpisodeState(episodeId)
        if (state.script) {
          state.script.content = generateScriptContent(sourceMaterial.text)
          state.script.status = 'ready'
          state.script.updatedAt = nowIso()
        }
        return { scriptId: state.script?.id ?? null }
      },
    })
    script.taskId = task.taskId

    return {
      project: clone(project),
      episodeId,
      sourceMaterialId: sourceMaterial.id,
      scriptTaskId: task.taskId,
    }
  },
}
