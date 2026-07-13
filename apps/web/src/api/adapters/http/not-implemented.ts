/**
 * 真实 Java API 尚未接入时的显式占位。
 * 调用会抛出清晰错误，避免静默返回空数据被误认为真实结果。
 */
export function notImplemented(method: string): never {
  throw new Error(
    `[http-adapter] 真实 Java API 未实现：${method}。请设置 VITE_API_MODE=mock，或实现该 adapter 方法。`,
  )
}
