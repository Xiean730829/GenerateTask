import type { ReactNode } from 'react'

export type BadgeTone = 'done' | 'active' | 'failed' | 'stale' | 'pending'

export function Badge({ tone = 'pending', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
