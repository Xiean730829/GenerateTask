// 极简可观察 store 基类，配合 React 18 的 useSyncExternalStore 使用。
// 选择自建而非引入状态库：MS1 状态形状明确、单例范围小，避免额外依赖。
export type Listener = () => void

export class Store<S> {
  private state: S
  private readonly listeners = new Set<Listener>()

  constructor(initial: S) {
    this.state = initial
  }

  getState = (): S => this.state

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** 用部分补丁替换状态（浅合并），并通知订阅者。 */
  protected set(patch: Partial<S> | ((prev: S) => Partial<S>)): void {
    const next = typeof patch === 'function' ? patch(this.state) : patch
    this.state = { ...this.state, ...next }
    this.listeners.forEach((l) => l())
  }
}
