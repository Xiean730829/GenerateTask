// Mock 后端聚合入口：组合 db、事件总线与任务引擎，暴露给各 mock 服务调用。
import { MockDb } from './db'
import { MockEventBus } from './event-bus'
import { seedDemoProjects } from './seed'
import { MockTaskEngine } from './task-engine'

export class MockBackend {
  readonly db = new MockDb()
  readonly bus = new MockEventBus()
  readonly engine = new MockTaskEngine(this.bus)
}

/** 模块级单例：整个 mock 客户端共享同一后端状态。 */
export const backend = new MockBackend()
seedDemoProjects(backend)

export { MockDb } from './db'
export type { EpisodeState } from './db'
export { MockEventBus } from './event-bus'
export { MockTaskEngine } from './task-engine'
