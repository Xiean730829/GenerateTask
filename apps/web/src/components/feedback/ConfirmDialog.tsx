import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

/** 保存下游影响改动前的确认对话框。用户确认后才保存并标记过期。 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认保存',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div className="card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="stack">
          <h3>{title}</h3>
          <div className="muted">{message}</div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onCancel}>取消</Button>
            <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
