import type { ReactNode } from 'react'

export function StageHeader({
  title,
  desc,
  actions,
}: {
  title: string
  desc?: string
  actions?: ReactNode
}) {
  return (
    <header className="stage-header">
      <div className="stack" style={{ gap: '0.25rem' }}>
        <h2 className="stage-header-title">{title}</h2>
        {desc && <p className="stage-header-desc">{desc}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  )
}
