import type { HttpClient } from './client'
import type {
  AssetService,
  EpisodeService,
  ExportService,
  KeyframeService,
  PanelService,
  PanelVideoService,
  ProjectService,
  ScriptService,
  ShotService,
  SourceMaterialService,
  TaskService,
  TimelineService,
} from '@/api/contracts'
import type {
  Asset,
  CreateProjectInput,
  CreateProjectResult,
  Episode,
  Export,
  ExportOptions,
  GenerationTask,
  Id,
  Keyframe,
  Panel,
  PanelVideo,
  Project,
  ProjectSummary,
  Script,
  Shot,
  SourceMaterial,
  Timeline,
  UpdateAssetInput,
  UpdateCharacterInput,
  UpdateScriptInput,
  UpdateShotInput,
  UpdateSourceMaterialInput,
  VideoCapability,
} from '@/api/types'
import type { CreateAssetForShotInput } from '@/api/types/asset'

export function createHttpProjects(http: HttpClient): ProjectService {
  return {
    async listRecent() {
      const projects = await http.get<Project[]>('/projects')
      return projects.map((project): ProjectSummary => ({
        id: project.id,
        name: project.name,
        aspectRatio: project.aspectRatio,
        defaultEpisodeId: project.defaultEpisodeId,
        updatedAt: project.updatedAt,
        stageLabel: project.stage,
        coverUrl: '',
      }))
    },
    get: (projectId) => http.get<Project>(`/projects/${projectId}`),
    async create(input: CreateProjectInput): Promise<CreateProjectResult> {
      const result = await http.post<CreateProjectResult>('/projects', {
        name: input.name,
        projectType: 'single_episode',
        targetDurationSeconds: input.targetDurationSeconds,
        aspectRatio: input.aspectRatio,
        style: input.style,
        sourceText: input.sourceText,
      })
      if (!input.sourceText) return result
      const task = await http.post<GenerationTask>(
        `/episodes/${result.defaultEpisode.id}/script-tasks`,
        {},
      )
      return { ...result, scriptTaskId: task.id }
    },
  }
}

export function createHttpEpisodes(http: HttpClient): EpisodeService {
  return {
    get: (episodeId) => http.get<Episode>(`/episodes/${episodeId}`),
    listByProject: (projectId) => http.get<Episode[]>(`/projects/${projectId}/episodes`),
    getVideoCapability: (episodeId) => http.get<VideoCapability>(`/episodes/${episodeId}/video-capability`),
  }
}

export function createHttpSourceMaterials(http: HttpClient): SourceMaterialService {
  return {
    async getByEpisode(episodeId) {
      const episode = await http.get<Episode>(`/episodes/${episodeId}`)
      const materials = await http.get<SourceMaterial[]>(`/projects/${episode.projectId}/materials`)
      const text = materials.find((m) => m.type === 'text')
      if (!text) throw new Error('未找到文本输入材料')
      return text
    },
    update: (id, input: UpdateSourceMaterialInput) =>
      http.patch<SourceMaterial>(`/materials/${id}`, input),
  }
}

export function createHttpScripts(http: HttpClient): ScriptService {
  return {
    getByEpisode: (episodeId) => http.get<Script | null>(`/episodes/${episodeId}/script`),
    update: (scriptId, input: UpdateScriptInput) => http.patch<Script>(`/scripts/${scriptId}`, input),
    async confirmAndGenerateShots(scriptId) {
      const task = await http.post<GenerationTask>(`/scripts/${scriptId}/confirm`, {})
      return { taskId: task.id }
    },
  }
}

export function createHttpShots(http: HttpClient): ShotService {
  return {
    listByEpisode: (episodeId) => http.get<Shot[]>(`/episodes/${episodeId}/shots`),
    update: (shotId, input: UpdateShotInput) => http.patch<Shot>(`/shots/${shotId}`, input),
  }
}

export function createHttpAssets(http: HttpClient): AssetService {
  return {
    listUserLibrary: () => http.get<Asset[]>('/assets'),
    async listForShot(shotId) {
      const overrides = await http.get<Array<{ assetId: Id }>>(`/shots/${shotId}/asset-overrides`)
      const assets = await Promise.all(overrides.map((o) => http.get<Asset>(`/assets/${o.assetId}`)))
      return assets
    },
    async prepareForShot(shotId) {
      const episode = await findEpisodeForShot(http, shotId)
      const task = await http.post<GenerationTask>(`/projects/${episode.projectId}/asset-extract-tasks`, {
        episodeId: episode.id,
        shotId,
      })
      return { taskId: task.id }
    },
    attachToShot: (shotId, assetId) =>
      http.post(`/shots/${shotId}/asset-overrides`, { assetId }).then(() => undefined),
    detachFromShot: (shotId, assetId) =>
      http.delete(`/shots/${shotId}/asset-overrides/${assetId}`),
    createForShot: (shotId, input: CreateAssetForShotInput) =>
      http.post<Asset>(`/shots/${shotId}/assets`, input),
    updateCharacter: (id, input: UpdateCharacterInput) => http.patch<Asset>(`/assets/${id}`, input),
    update: (id, input: UpdateAssetInput) => http.patch<Asset>(`/assets/${id}`, input),
    createRevision: (id) => http.post<Asset>(`/assets/${id}/revisions`, {}),
    async generateReferenceImage(id) {
      const task = await http.post<GenerationTask>(`/assets/${id}/reference-image-tasks`, {})
      return { taskId: task.id }
    },
    confirmReferenceImage: (id, mediaFileId) =>
      http.post<Asset>(`/assets/${id}/reference-images/${mediaFileId}/confirm`, {}),
  }
}

export function createHttpKeyframes(http: HttpClient): KeyframeService {
  return {
    listByEpisode: (episodeId) => http.get<Keyframe[]>(`/episodes/${episodeId}/keyframes`),
    async generateNextBatch(episodeId) {
      const result = await http.post<{ task: GenerationTask; shotIds: Id[] }>(
        `/episodes/${episodeId}/keyframe-tasks/batch`,
        {},
      )
      return { taskId: result.task.id, shotIds: result.shotIds }
    },
    async regenerate(shotId) {
      const task = await http.post<GenerationTask>(`/shots/${shotId}/keyframe-tasks`, {})
      return { taskId: task.id }
    },
    select: (keyframeId) => http.post<Keyframe>(`/keyframes/${keyframeId}/select`, {}),
  }
}

export function createHttpPanels(http: HttpClient): PanelService {
  return {
    listByEpisode: (episodeId) => http.get<Panel[]>(`/episodes/${episodeId}/panels`),
    assemble: (episodeId) => http.post<Panel[]>(`/episodes/${episodeId}/panels/assemble`, {}),
  }
}

export function createHttpPanelVideos(http: HttpClient): PanelVideoService {
  return {
    listByEpisode: (episodeId) => http.get<PanelVideo[]>(`/episodes/${episodeId}/panel-videos`),
    async generate(panelId) {
      const task = await http.post<GenerationTask>(`/panels/${panelId}/video-tasks`, {})
      return { taskId: task.id }
    },
    async generateBatch(episodeId) {
      const result = await http.post<{ tasks: GenerationTask[] }>(
        `/episodes/${episodeId}/panel-video-tasks/batch`,
        {},
      )
      return { taskIds: result.tasks.map((t) => t.id) }
    },
  }
}

export function createHttpTimelines(http: HttpClient): TimelineService {
  return {
    getByEpisode: (episodeId) => http.get<Timeline | null>(`/episodes/${episodeId}/timeline`),
    async generateAudioSubtitle(episodeId) {
      const task = await http.post<GenerationTask>(`/episodes/${episodeId}/audio-subtitle-tasks`, {})
      return { taskId: task.id }
    },
    compose: (episodeId) => http.post<Timeline>(`/episodes/${episodeId}/timeline/compose`, {}),
  }
}

export function createHttpExports(http: HttpClient): ExportService {
  return {
    async getByEpisode(episodeId) {
      const timeline = await http.get<Timeline | null>(`/episodes/${episodeId}/timeline`)
      if (!timeline) return null
      const exports = await http.get<Export[]>(`/timelines/${timeline.id}/exports`)
      return exports[0] ?? null
    },
    async create(episodeId, options: ExportOptions) {
      const timeline = await http.get<Timeline>(`/episodes/${episodeId}/timeline`)
      const task = await http.post<GenerationTask>(`/timelines/${timeline.id}/exports`, options)
      return { taskId: task.id }
    },
  }
}

export function createHttpTasks(http: HttpClient): TaskService {
  return {
    listByEpisode: (episodeId) => http.get<GenerationTask[]>(`/episodes/${episodeId}/tasks`),
    get: (taskId) => http.get<GenerationTask>(`/tasks/${taskId}`),
    cancel: (taskId) => http.post<GenerationTask>(`/tasks/${taskId}/cancel`, {}),
    retry: (taskId) => http.post<GenerationTask>(`/tasks/${taskId}/retry`, {}),
  }
}

async function findEpisodeForShot(http: HttpClient, shotId: Id): Promise<Episode> {
  const shot = await http.get<Shot>(`/shots/${shotId}`)
  return http.get<Episode>(`/episodes/${shot.episodeId}`)
}
