// Mock 后端内部工具：ID、时间、延时。仅供 mock 模块使用。

let counter = 0

/** 生成稳定可读的自增 id（带前缀）。 */
export function mockId(prefix: string): string {
  counter += 1
  return `${prefix}_${counter.toString(36)}${Math.floor(
    Math.random() * 1e4,
  ).toString(36)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** 浅克隆，模拟“从服务端取回新对象”，避免调用方直接持有内部引用。 */
export function clone<T>(value: T): T {
  return structuredClone(value)
}
