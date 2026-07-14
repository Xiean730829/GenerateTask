import { api } from '@/api'
import type { GenerationTask, Id, TaskType, TaskUpdatedEvent } from '@/api'
import { isTerminalStatus } from '@/api'
import { Store } from './create-store'
import { initialWorkspaceState, type WorkspaceState } from './workspace-types'

export class WorkspaceStore extends Store<WorkspaceState> {
  private unsubEvents: (() => void) | null = null
  private unsubConn: (() => void) | null = null

  constructor(readonly episodeId: Id) {
    super({ ...initialWorkspaceState })
  }

  async init(): Promise<void> {
    this.set({ load: 'loading', error: null })
    try {
      const episode = await api.episodes.get(this.episodeId)
      const project = await api.projects.get(episode.projectId)
      this.set({ episode, project })
      await this.refreshAll()
      this.subscribeEvents()
      this.set({ load: 'ready' })
    } catch (e) {
      this.set({ load: 'error', error: errText(e) })
    }
  }

  dispose(): void {
    this.unsubEvents?.()
    this.unsubConn?.()
    this.unsubEvents = null
    this.unsubConn = null
  }

  private subscribeEvents(): void {
    this.unsubEvents = api.taskEvents.subscribe(this.episodeId, (ev) => this.onTaskEvent(ev))
    this.unsubConn = api.taskEvents.onConnectionChange(this.episodeId, (state) => {
      this.set({ connection: state })
      if (state === 'open') void this.reconcileTasks()
    })
  }

  private onTaskEvent(ev: TaskUpdatedEvent): void {
    const task = ev.data
    this.set((prev) => ({ tasks: { ...prev.tasks, [task.id]: task } }))
    if (isTerminalStatus(task.status)) void this.onTaskTerminal(task)
  }

  private async onTaskTerminal(task: GenerationTask): Promise<void> {
    await this.refreshForTaskType(task.taskType)
  }

  private async reconcileTasks(): Promise<void> {
    try {
      const tasks = await api.tasks.listByEpisode(this.episodeId)
      const map: Record<Id, GenerationTask> = {}
      for (const t of tasks) map[t.id] = t
      this.set({ tasks: map })
    } catch {
      // 校正失败不阻塞 UI。
    }
  }

  private async refreshForTaskType(type: TaskType): Promise<void> {
    switch (type) {
      case 'script.generate':
        return this.refreshScript()
      case 'shot.generate':
        return this.refreshShots()
      case 'asset.extract':
        await Promise.all([this.refreshAssets(), this.refreshShots()])
        return
      case 'asset.image.generate':
        return this.refreshAssets()
      case 'keyframe.generate':
        return this.refreshKeyframes()
      case 'video.generate':
        return this.refreshPanelVideos()
      case 'audio.subtitle':
        await this.finalizeTimelineCompose()
        return
      case 'export.compose':
        return this.refreshExport()
    }
  }

  private async finalizeTimelineCompose(): Promise<void> {
    const timeline = await api.timelines.compose(this.episodeId)
    this.set({ timeline })
  }

  private async refreshAll(): Promise<void> {
    const [capability] = await Promise.all([
      api.episodes.getVideoCapability(this.episodeId),
      this.refreshSourceMaterial(),
      this.refreshScript(),
      this.refreshShots(),
      this.refreshAssets(),
      this.refreshKeyframes(),
      this.refreshPanels(),
      this.refreshPanelVideos(),
      this.refreshTimeline(),
      this.refreshExport(),
    ])
    this.set({ videoCapability: capability })
  }

  private async refreshSourceMaterial(): Promise<void> {
    this.set({ sourceMaterial: await api.sourceMaterials.getByEpisode(this.episodeId) })
  }

  private async refreshScript(): Promise<void> {
    this.set({ script: await api.scripts.getByEpisode(this.episodeId) })
  }

  private async refreshShots(): Promise<void> {
    const shots = await api.shots.listByEpisode(this.episodeId)
    this.set({ shots })
    await this.refreshShotAssets()
  }

  private async refreshShotAssets(): Promise<void> {
    const shots = this.getState().shots
    if (shots.length === 0) {
      this.set({ shotAssets: {} })
      return
    }
    const entries = await Promise.all(
      shots.map(async (shot) => [shot.id, await api.assets.listForShot(shot.id)] as const),
    )
    this.set({ shotAssets: Object.fromEntries(entries) })
  }

  private async refreshAssets(): Promise<void> {
    const assets = await api.assets.listUserLibrary()
    this.set({ assets, assetsLocked: assets.length > 0 && assets.every((a) => a.locked) })
  }

  private async refreshKeyframes(): Promise<void> {
    this.set({ keyframes: await api.keyframes.listByEpisode(this.episodeId) })
  }

  private async refreshPanels(): Promise<void> {
    this.set({ panels: await api.panels.listByEpisode(this.episodeId) })
  }

  private async refreshPanelVideos(): Promise<void> {
    this.set({ panelVideos: await api.panelVideos.listByEpisode(this.episodeId) })
  }

  private async refreshTimeline(): Promise<void> {
    this.set({ timeline: await api.timelines.getByEpisode(this.episodeId) })
  }

  private async refreshExport(): Promise<void> {
    this.set({ exportRecord: await api.exports.getByEpisode(this.episodeId) })
  }

  saveSourceMaterial = async (text: string): Promise<void> => {
    const sm = this.getState().sourceMaterial
    if (!sm) return
    this.set({ sourceMaterial: await api.sourceMaterials.update(sm.id, { text }) })
  }

  saveScript = async (content: string): Promise<void> => {
    const script = this.getState().script
    if (!script) return
    this.set({ script: await api.scripts.update(script.id, { content }) })
  }

  confirmScript = async (): Promise<void> => {
    const script = this.getState().script
    if (!script) return
    const { taskId } = await api.scripts.confirmAndGenerateShots(script.id)
    await this.refreshScript()
    try {
      const task = await api.tasks.get(taskId)
      this.set((prev) => ({ tasks: { ...prev.tasks, [taskId]: task } }))
    } catch {
      // 依赖事件回流。
    }
  }

  saveShot = async (shotId: Id, input: Parameters<typeof api.shots.update>[1]): Promise<void> => {
    await api.shots.update(shotId, input)
    await Promise.all([this.refreshShots(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  prepareShotMaterials = async (shotId: Id): Promise<void> => {
    await api.assets.prepareForShot(shotId)
    await Promise.all([this.refreshAssets(), this.refreshShotAssets()])
  }

  getShotMaterials = (shotId: Id) => api.assets.listForShot(shotId)

  attachAssetToShot = async (shotId: Id, assetId: Id): Promise<void> => {
    await api.assets.attachToShot(shotId, assetId)
    await Promise.all([this.refreshShots(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  detachAssetFromShot = async (shotId: Id, assetId: Id): Promise<void> => {
    await api.assets.detachFromShot(shotId, assetId)
    await Promise.all([this.refreshShots(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  createAssetForShot = async (
    shotId: Id,
    input: Parameters<typeof api.assets.createForShot>[1],
  ): Promise<void> => {
    await api.assets.createForShot(shotId, input)
    await Promise.all([this.refreshAssets(), this.refreshShots(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  updateCharacter = async (
    id: Id,
    input: Parameters<typeof api.assets.updateCharacter>[1],
  ): Promise<void> => {
    await api.assets.updateCharacter(id, input)
    await this.refreshAssets()
  }

  updateAsset = async (id: Id, input: Parameters<typeof api.assets.update>[1]): Promise<void> => {
    await api.assets.update(id, input)
    await this.refreshAssets()
  }

  confirmAssetDefinition = async (assetId: Id): Promise<void> => {
    await api.assets.createRevision(assetId)
    await Promise.all([this.refreshAssets(), this.refreshShotAssets()])
  }

  generateAssetImage = async (assetId: Id): Promise<void> => {
    await api.assets.generateReferenceImage(assetId)
    await Promise.all([this.refreshAssets(), this.refreshShotAssets()])
  }

  confirmAssetImage = async (assetId: Id, mediaFileId: Id): Promise<void> => {
    await api.assets.confirmReferenceImage(assetId, mediaFileId)
    await Promise.all([this.refreshAssets(), this.refreshShotAssets()])
  }

  generateNextKeyframeBatch = async (): Promise<void> => {
    await api.keyframes.generateNextBatch(this.episodeId)
    await this.refreshKeyframes()
  }

  regenerateKeyframes = async (shotId: Id): Promise<void> => {
    await api.keyframes.regenerate(shotId)
    await this.refreshKeyframes()
  }

  selectKeyframe = async (_shotId: Id, keyframeId: Id): Promise<void> => {
    await api.keyframes.select(keyframeId)
    await Promise.all([this.refreshKeyframes(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  assemblePanels = async (): Promise<void> => {
    await api.panels.assemble(this.episodeId)
    await Promise.all([this.refreshPanels(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  generatePanelVideo = async (panelId: Id): Promise<void> => {
    await api.panelVideos.generate(panelId)
    await this.refreshPanelVideos()
  }

  generateAllPanelVideos = async (): Promise<void> => {
    await api.panelVideos.generateBatch(this.episodeId)
    await this.refreshPanelVideos()
  }

  composeTimeline = async (): Promise<void> => {
    const { taskId } = await api.timelines.generateAudioSubtitle(this.episodeId)
    try {
      const task = await api.tasks.get(taskId)
      this.set((prev) => ({ tasks: { ...prev.tasks, [taskId]: task } }))
    } catch {
      // 依赖事件回流。
    }
  }

  createExport = async (options: Parameters<typeof api.exports.create>[1]): Promise<void> => {
    await api.exports.create(this.episodeId, options)
    await this.refreshExport()
  }

  cancelTask = async (taskId: Id): Promise<void> => {
    await api.tasks.cancel(taskId)
  }

  retryTask = async (taskId: Id): Promise<void> => {
    await api.tasks.retry(taskId)
  }
}

export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
