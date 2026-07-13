import type { StageKey } from '@/api'
import { useWorkspaceState } from '@/stores/workspace-context'
import { STAGES, isStageUnlocked } from './stages'
import { deriveStageStatus } from './stage-status'

/**
 * 顶部常驻阶段导航：展示完成 / 进行中 / 待处理 / 失败 / 失效。
 * 允许回看已完成阶段，但不允许绕过前置条件启动后续阶段（未解锁禁用）。
 */
export function StageNav({
  current,
  onSelect,
}: {
  current: StageKey
  onSelect: (s: StageKey) => void
}) {
  const state = useWorkspaceState()
  return (
    <nav className="stage-nav" aria-label="生产阶段导航">
      {STAGES.map(({ key, label }, index) => {
        const status = deriveStageStatus(state, key)
        const unlocked = isStageUnlocked(state, key) || status === 'done'
        return (
          <span key={key} style={{ display: 'contents' }}>
            {index > 0 && <span className="stage-connector" aria-hidden />}
            <button
              className={`stage-chip ${key === current ? 'is-current' : ''}`}
              disabled={!unlocked}
              title={!unlocked ? '需先完成前置阶段' : undefined}
              aria-current={key === current ? 'step' : undefined}
              onClick={() => onSelect(key)}
            >
              <span className={`stage-dot ${status}`} aria-hidden />
              {label}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
