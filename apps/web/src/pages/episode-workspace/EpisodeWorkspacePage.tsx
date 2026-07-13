import { useParams } from 'react-router-dom'
import { WorkspaceProvider } from '@/stores/workspace-context'
import { WorkspaceShell } from './WorkspaceShell'

export function EpisodeWorkspacePage() {
  const { episodeId } = useParams<{ projectId: string; episodeId: string }>()
  if (!episodeId) return <div className="workspace-body">缺少 episodeId</div>

  return (
    <WorkspaceProvider episodeId={episodeId}>
      <WorkspaceShell />
    </WorkspaceProvider>
  )
}
