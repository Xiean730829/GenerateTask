import { Warning } from '@phosphor-icons/react'
import { apiMode, isMockMode } from '@/api'

/** 开发环境明确提示当前处于 Mock 数据模式，避免误认为真实生成结果。 */
export function MockBanner() {
  if (!isMockMode) return null
  return (
    <div className="mock-banner" role="status">
      <Warning size={16} weight="fill" />
      Mock 数据模式（VITE_API_MODE={apiMode}）：所有生成结果均为占位演示，非真实模型产物。
    </div>
  )
}
