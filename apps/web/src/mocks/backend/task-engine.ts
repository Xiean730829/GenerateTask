// Mock 任务状态机引擎。
import type { GenerationTask, Id, TaskStatus, TaskType } from '@/api/types'
import { isCancelable } from '@/api/types'
import type { MockEventBus } from './event-bus'
import { backend } from './index'
import { clone, mockId, nowIso } from './util'

export interface TaskFailure {
  code: string
  message: string
  retryable: boolean
}

export type FailurePolicy = (attempt: number) => TaskFailure | null

export interface TaskSpec {
  episodeId: Id
  taskType: TaskType
  onSucceed: () => unknown
  failure?: FailurePolicy
  onFail?: (error: TaskFailure) => void
  stepMs?: number
}

interface Runtime {
  task: GenerationTask
  spec: TaskSpec
  attempt: number
  timers: ReturnType<typeof setTimeout>[]
}

const PROGRESS_STEPS = [15, 40, 65, 88]

export class MockTaskEngine {
  private readonly tasks = new Map<Id, Runtime>()

  constructor(private readonly bus: MockEventBus) {}

  start(spec: TaskSpec): GenerationTask {
    const state = backend.db.getEpisodeState(spec.episodeId)
    const project = backend.db.getProject(state.episode.projectId)
    const task: GenerationTask = {
      id: mockId('task'),
      projectId: project.id,
      episodeId: spec.episodeId,
      shotId: null,
      panelId: null,
      taskType: spec.taskType,
      status: 'pending',
      attempt: 1,
      progress: 0,
      errorCode: null,
      errorMessage: null,
      retryable: null,
      resultRef: null,
      costPoints: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    const rt: Runtime = { task, spec, attempt: 1, timers: [] }
    this.tasks.set(task.id, rt)
    this.emit(rt)
    this.schedule(rt)
    return clone(task)
  }

  get(taskId: Id): GenerationTask | undefined {
    const rt = this.tasks.get(taskId)
    return rt ? clone(rt.task) : undefined
  }

  listByEpisode(episodeId: Id): GenerationTask[] {
    return [...this.tasks.values()]
      .filter((rt) => rt.task.episodeId === episodeId)
      .map((rt) => clone(rt.task))
  }

  cancel(taskId: Id): GenerationTask {
    const rt = this.require(taskId)
    if (!isCancelable(rt.task.status)) throw new Error('仅 pending / queued 任务可取消')
    this.clearTimers(rt)
    this.transition(rt, 'canceled')
    return clone(rt.task)
  }

  retry(taskId: Id): GenerationTask {
    const rt = this.require(taskId)
    if (rt.task.status !== 'failed' || !rt.task.retryable) throw new Error('仅可重试失败任务')
    rt.attempt += 1
    rt.task.attempt = rt.attempt
    rt.task.errorCode = null
    rt.task.errorMessage = null
    rt.task.retryable = null
    rt.task.progress = 0
    this.transition(rt, 'retrying')
    this.schedule(rt)
    return clone(rt.task)
  }

  private schedule(rt: Runtime): void {
    const step = rt.spec.stepMs ?? 320
    this.clearTimers(rt)
    const at = (i: number, fn: () => void) => rt.timers.push(setTimeout(fn, step * i))
    at(1, () => this.transition(rt, 'queued'))
    at(2, () => this.transition(rt, 'running', 0))
    PROGRESS_STEPS.forEach((p, i) => at(3 + i, () => this.transition(rt, 'running', p)))
    at(3 + PROGRESS_STEPS.length, () => this.finish(rt))
  }

  private finish(rt: Runtime): void {
    const error = rt.spec.failure?.(rt.attempt) ?? null
    if (error) {
      rt.task.errorCode = error.code
      rt.task.errorMessage = error.message
      rt.task.retryable = error.retryable
      rt.spec.onFail?.(error)
      this.transition(rt, 'failed')
      return
    }
    try {
      const result = rt.spec.onSucceed()
      rt.task.resultRef = result && typeof result === 'object' ? (result as Record<string, unknown>) : null
      this.transition(rt, 'succeeded', 100)
    } catch (e) {
      rt.task.errorCode = 'MOCK_APPLY_FAILED'
      rt.task.errorMessage = e instanceof Error ? e.message : '产物写入失败'
      rt.task.retryable = true
      this.transition(rt, 'failed')
    }
  }

  private transition(rt: Runtime, status: TaskStatus, progress?: number): void {
    rt.task.status = status
    if (progress !== undefined) rt.task.progress = progress
    if (status === 'failed' || status === 'canceled') rt.task.progress = 0
    rt.task.updatedAt = nowIso()
    this.emit(rt)
  }

  private emit(rt: Runtime): void {
    this.bus.emit(rt.task.episodeId, { type: 'task.updated', data: clone(rt.task) })
  }

  private clearTimers(rt: Runtime): void {
    rt.timers.forEach(clearTimeout)
    rt.timers = []
  }

  private require(taskId: Id): Runtime {
    const rt = this.tasks.get(taskId)
    if (!rt) throw new Error(`任务不存在：${taskId}`)
    return rt
  }
}
