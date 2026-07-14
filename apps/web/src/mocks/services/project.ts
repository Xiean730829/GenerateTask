import type { ProjectService } from '@/api/contracts'
import type { CreateProjectResult, Episode, Project, Script, SourceMaterial } from '@/api/types'
import { backend } from '@/mocks/backend'
import { generateScriptContent } from '@/mocks/backend/content'
import { clone, mockId, nowIso } from '@/mocks/backend/util'
import { deriveProjectCover } from './project-cover'
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
        coverUrl: deriveProjectCover(project, state),
      }
    })
  },

  async get(projectId) {
    return clone(backend.db.getProject(projectId))
  },

  async create(input): Promise<CreateProjectResult> {
    const ts = nowIso()
    const projectId = mockId('proj')
    const episodeId = mockId('ep')
    const ownerUserId = 'demo-user'

    const episode: Episode = {
      id: episodeId,
      projectId,
      title: '第 1 集',
      synopsis: null,
      orderIndex: 0,
      targetDurationSeconds: input.targetDurationSeconds,
      status: 'active',
      createdAt: ts,
      updatedAt: ts,
    }
    const project: Project = {
      id: projectId,
      ownerUserId,
      name: input.name,
      projectType: 'single_episode',
      stage: 'script',
      targetDurationSeconds: input.targetDurationSeconds,
      aspectRatio: input.aspectRatio,
      style: input.style,
      defaultEpisodeId: episodeId,
      createdAt: ts,
      updatedAt: ts,
    }
    const sourceMaterial: SourceMaterial = {
      id: mockId('src'),
      projectId,
      type: 'text',
      text: input.sourceText,
      title: null,
      status: 'ready',
      createdAt: ts,
    }
    const script: Script = {
      id: mockId('script'),
      episodeId,
      title: null,
      logline: null,
      content: '',
      scenes: [],
      version: 1,
      status: 'draft',
      confirmedAt: null,
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
      shotAssetOverrides: [],
      panels: [],
      panelRevisions: [],
      panelVideos: [],
      timeline: null,
      exportRecord: null,
      failedOnce: new Set(),
    })
    backend.db.touchRecent(projectId)

    const task = backend.engine.start({
      episodeId,
      taskType: 'script.generate',
      onSucceed: () => {
        const state = backend.db.getEpisodeState(episodeId)
        if (state.script) {
          state.script.content = generateScriptContent(sourceMaterial.text ?? '')
          state.script.updatedAt = nowIso()
        }
        return { scriptId: state.script?.id ?? null }
      },
    })

    return {
      project: clone(project),
      defaultEpisode: clone(episode),
      sourceMaterial: clone(sourceMaterial),
      scriptTaskId: task.id,
    }
  },
}
