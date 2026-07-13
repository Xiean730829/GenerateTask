import type { Panel, PanelVideo } from '@/api'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TaskStatusInline } from '@/components/feedback/TaskStatusInline'
import { useTask } from '@/hooks/useTask'
import { useWorkspaceStore } from '@/stores/workspace-context'

const STATUS_LABEL: Record<PanelVideo['status'], string> = {
  none: '未生成',
  generating: '生成中',
  ready: '已生成',
  failed: '失败',
  stale: '已失效',
}
const STATUS_TONE: Record<PanelVideo['status'], BadgeTone> = {
  none: 'pending',
  generating: 'active',
  ready: 'done',
  failed: 'failed',
  stale: 'stale',
}

/** Panel 视频卡：就地展示视频任务状态、进度、错误、重试、预览与失效状态。 */
export function PanelVideoCard({
  panel,
  video,
  selected = false,
  onSelect,
}: {
  panel: Panel
  video: PanelVideo
  selected?: boolean
  onSelect?: () => void
}) {
  const store = useWorkspaceStore()
  const task = useTask(video.taskId)
  const busy = video.status === 'generating'
  const label = video.status === 'ready' && video.freshness === 'stale' ? '已失效' : STATUS_LABEL[video.status]

  return (
    <div
      className={`card stack panel-video-card ${selected ? 'is-selected' : ''} ${video.status === 'stale' ? 'is-stale' : ''} ${video.status === 'failed' ? 'is-failed' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.()
        }
      }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>Panel {panel.order}</strong>
        <Badge tone={STATUS_TONE[video.status]}>{label}</Badge>
      </div>
      {video.videoUrl && video.status === 'ready' ? (
        <img src={video.videoUrl} alt={`Panel ${panel.order} 预览`} width="100%" style={{ borderRadius: 8 }} />
      ) : (
        <div className="muted" style={{ fontSize: '0.82rem' }}>{panel.durationSec}s · {panel.shotIds.length} 个镜头</div>
      )}
      <TaskStatusInline task={task} />
      <div className="row">
        <Button size="sm" variant={video.status === 'ready' ? 'ghost' : 'primary'} disabled={busy}
          onClick={(event) => {
            event.stopPropagation()
            void store.generatePanelVideo(panel.id)
          }}>
          {video.status === 'none' ? '生成视频' : video.status === 'ready' ? '重新生成' : '重试生成'}
        </Button>
      </div>
    </div>
  )
}
