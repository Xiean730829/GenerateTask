import type { Shot } from '@/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { useLatestTaskByType } from '@/hooks/useLatestTaskByType'
import { useKeyframesByShot } from '@/hooks/useKeyframesByShot'
import { mediaUrlFromId } from '@/lib/media-url'
import { useWorkspaceStore } from '@/stores/workspace-context'

/** 九宫格回写到单个 Shot 后的确认与局部重做。 */
export function ShotKeyframePanel({ shot }: { shot: Shot }) {
  const store = useWorkspaceStore()
  const entry = useKeyframesByShot(shot.id)
  const task = useLatestTaskByType('keyframe.generate')
  const generating = task && task.status !== 'succeeded' && task.status !== 'failed' && task.status !== 'canceled'

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>镜头 {shot.orderIndex + 1}</strong>
        <div className="row">
          {entry?.selectedKeyframeId ? <Badge tone="done">已选定</Badge> : <Badge tone="pending">未选定</Badge>}
          <Button size="sm" variant="ghost" disabled={generating || !entry?.candidates.length}
            onClick={() => void store.regenerateKeyframes(shot.id)}>
            重新生成
          </Button>
        </div>
      </div>
      <span className="muted" style={{ fontSize: '0.8rem' }}>{shot.action}</span>
      <TaskStatusInline task={task} />
      {entry && entry.candidates.length > 0 && (
        <div className="row">
          {entry.candidates.map((kf) => {
            const selected = entry.selectedKeyframeId === kf.id
            return (
              <button
                key={kf.id}
                onClick={() => void store.selectKeyframe(shot.id, kf.id)}
                style={{
                  padding: 0,
                  border: selected ? '2px solid var(--primary)' : '2px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: 'none',
                }}
                title={selected ? '当前选定' : '确认此镜头关键帧'}
              >
                <img src={mediaUrlFromId(kf.mediaFileId)} alt={`镜头 ${shot.orderIndex + 1} 的关键帧`} width={130} height={180} style={{ borderRadius: 6, display: 'block' }} />
              </button>
            )
          })}
        </div>
      )}
      {(!entry || entry.candidates.length === 0) && !generating && (
        <span className="muted" style={{ fontSize: '0.82rem' }}>尚无候选关键帧。</span>
      )}
    </div>
  )
}
