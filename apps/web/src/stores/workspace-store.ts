import { api } from '@/api'
import type { GenerationTask, Id, TaskType, TaskUpdatedEvent } from '@/api'
import { isTerminalStatus } from '@/api'
import { Store } from './create-store'
import { initialWorkspaceState, type WorkspaceState } from './workspace-types'

/**
 * Episode 工作台业务状态。
 * - 通过业务 SDK（api）读写后端，绝不裸调 HTTP / WS。
 * - 订阅 Episode 任务事件，按 taskId 就地更新对象；终态成功后拉取对应业务对象校正。
 */
export class WorkspaceStore extends Store<WorkspaceState> {
  private unsubEvents: (() => void) | null = null
  private unsubConn: (() => void) | null = null

  constructor(readonly episodeId: Id) {
    super({ ...initialWorkspaceState })
  }

  /** 加载全部数据并建立任务事件订阅。 */
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
    this.unsubEvents = api.taskEvents.subscribe(this.episodeId, (ev) =>
      this.onTaskEvent(ev),
    )
    this.unsubConn = api.taskEvents.onConnectionChange(this.episodeId, (state) => {
      this.set({ connection: state })
      // 连接建立 / 重连后，用任务查询接口校正，避免丢包导致状态漂移。
      if (state === 'open') void this.reconcileTasks()
    })
  }

  private onTaskEvent(ev: TaskUpdatedEvent): void {
    const task = ev.data
    this.set((prev) => ({ tasks: { ...prev.tasks, [task.taskId]: task } }))
    if (isTerminalStatus(task.status)) void this.onTaskTerminal(task)
  }

  /** 终态任务：拉取其影响的业务对象，使 UI 反映最终结果。 */
  private async onTaskTerminal(task: GenerationTask): Promise<void> {
    await this.refreshForTaskType(task.taskType)
  }

  private async reconcileTasks(): Promise<void> {
    try {
      const tasks = await api.tasks.listByEpisode(this.episodeId)
      const map: Record<Id, GenerationTask> = {}
      for (const t of tasks) map[t.taskId] = t
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
      case 'panel.assemble':
        await this.refreshPanels()
        return this.refreshPanelVideos()
      case 'panel-video.generate':
        return this.refreshPanelVideos()
      case 'timeline.compose':
        return this.refreshTimeline()
      case 'export.render':
        return this.refreshExport()
    }
  }

  // ---- 数据刷新（每个 slice 独立，供事件回调与 action 复用）----

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
    this.set({ shots: await api.shots.listByEpisode(this.episodeId) })
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
    this.set({ exportJob: await api.exports.getByEpisode(this.episodeId) })
  }

  // ---- 用户动作：均通过业务 SDK，任务进度由事件驱动回流 ----

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
    // 立即登记镜头任务，避免切到镜头阶段后等待 WS 首包前出现空白。
    try {
      const task = await api.tasks.get(taskId)
      this.set((prev) => ({ tasks: { ...prev.tasks, [taskId]: task } }))
    } catch {
      // 任务查询失败时仍依赖事件回流。
    }
  }

  saveShot = async (shotId: Id, input: Parameters<typeof api.shots.update>[1]): Promise<void> => {
    await api.shots.update(shotId, input)
    await Promise.all([this.refreshShots(), this.refreshPanelVideos(), this.refreshTimeline()])
  }

  prepareShotMaterials = async (shotId: Id): Promise<void> => {
    await api.assets.prepareForShot(shotId)
    await this.refreshAssets()
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

  updateAsset = async (
    id: Id,
    input: Parameters<typeof api.assets.update>[1],
  ): Promise<void> => {
    await api.assets.update(id, input)
    await this.refreshAssets()
  }

  confirmAssetDefinition = async (assetId: Id): Promise<void> => {
    await api.assets.confirmDefinition(assetId)
    await this.refreshAssets()
  }

  generateAssetImage = async (assetId: Id): Promise<void> => {
    await api.assets.generateImage(assetId)
    await this.refreshAssets()
  }

  confirmAssetImage = async (assetId: Id, imageUrl: string): Promise<void> => {
    await api.assets.confirmImage(assetId, imageUrl)
    await this.refreshAssets()
  }

  generateNextKeyframeBatch = async (): Promise<void> => {
    await api.keyframes.generateNextBatch(this.episodeId)
    await this.refreshKeyframes()
  }

  regenerateKeyframes = async (shotId: Id): Promise<void> => {
    await api.keyframes.regenerate(shotId)
    await this.refreshKeyframes()
  }

  selectKeyframe = async (shotId: Id, keyframeId: Id): Promise<void> => {
    await api.keyframes.select(shotId, keyframeId)
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
    await api.timelines.compose(this.episodeId)
    await this.refreshTimeline()
  }

  estimateExport = (options: Parameters<typeof api.exports.estimate>[1]) =>
    api.exports.estimate(this.episodeId, options)

  createExport = async (
    options: Parameters<typeof api.exports.create>[1],
  ): Promise<void> => {
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
