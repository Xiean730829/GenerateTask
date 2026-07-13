// Mock 任务状态机引擎：pending → queued → running → succeeded / failed。
// 逐步推进进度并通过事件总线推送完整快照；支持取消与重试。
import type {
  GenerationTask,
  Id,
  TaskError,
  TaskStatus,
  TaskType,
} from '@/api/types'
import { isCancelable } from '@/api/types'
import type { MockEventBus } from './event-bus'
import { clone, mockId, nowIso } from './util'

/** 失败判定：返回 TaskError 则失败，返回 null 则成功。attempt 从 1 开始。 */
export type FailurePolicy = (attempt: number) => TaskError | null

export interface TaskSpec {
  episodeId: Id
  taskType: TaskType
  /** 成功时执行：更新业务对象并返回 result 引用。 */
  onSucceed: () => unknown
  /** 可选失败策略，用于演示错误与重试 UI。 */
  failure?: FailurePolicy
  /** 失败 / 取消时回写业务对象（如把 Panel 视频置为 failed）。 */
  onFail?: (error: TaskError) => void
  /** 每步间隔（毫秒），默认 320。 */
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

  /** 创建并启动一个任务，返回其快照。 */
  start(spec: TaskSpec): GenerationTask {
    const task: GenerationTask = {
      taskId: mockId('task'),
      episodeId: spec.episodeId,
      taskType: spec.taskType,
      status: 'pending',
      progress: 0,
      result: null,
      error: null,
      updatedAt: nowIso(),
    }
    const rt: Runtime = { task, spec, attempt: 1, timers: [] }
    this.tasks.set(task.taskId, rt)
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
    if (!isCancelable(rt.task.status)) {
      throw new Error('仅 pending / queued 任务可取消')
    }
    this.clearTimers(rt)
    this.transition(rt, 'canceled')
    return clone(rt.task)
  }

  retry(taskId: Id): GenerationTask {
    const rt = this.require(taskId)
    if (rt.task.status !== 'failed' || !rt.task.error?.retryable) {
      throw new Error('仅可重试失败任务')
    }
    rt.attempt += 1
    rt.task.error = null
    rt.task.progress = 0
    this.transition(rt, 'retrying')
    this.schedule(rt)
    return clone(rt.task)
  }

  private schedule(rt: Runtime): void {
    const step = rt.spec.stepMs ?? 320
    this.clearTimers(rt)
    const at = (i: number, fn: () => void) =>
      rt.timers.push(setTimeout(fn, step * i))

    at(1, () => this.transition(rt, 'queued'))
    at(2, () => this.transition(rt, 'running', 0))
    PROGRESS_STEPS.forEach((p, i) =>
      at(3 + i, () => this.transition(rt, 'running', p)),
    )
    at(3 + PROGRESS_STEPS.length, () => this.finish(rt))
  }

  private finish(rt: Runtime): void {
    const error = rt.spec.failure?.(rt.attempt) ?? null
    if (error) {
      rt.task.error = error
      rt.spec.onFail?.(error)
      this.transition(rt, 'failed')
      return
    }
    try {
      rt.task.result = rt.spec.onSucceed() ?? null
      this.transition(rt, 'succeeded', 100)
    } catch (e) {
      rt.task.error = {
        code: 'MOCK_APPLY_FAILED',
        message: e instanceof Error ? e.message : '产物写入失败',
        retryable: true,
      }
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
    this.bus.emit(rt.task.episodeId, {
      type: 'task.updated',
      data: clone(rt.task),
    })
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
