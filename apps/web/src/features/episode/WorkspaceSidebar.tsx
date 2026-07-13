import { useEffect, useState } from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Episode } from '@/api'
import { useOptionalWorkspaceState } from '@/stores/workspace-context'
import { errText } from '@/stores/workspace-store'

/** 左侧项目树状导航：分集、资产库、项目设置。 */
export function WorkspaceSidebar() {
  const { projectId } = useParams<{ projectId: string; episodeId?: string }>()
  const workspace = useOptionalWorkspaceState()
  const [episodes, setEpisodes] = useState<Episode[]>(workspace?.episode ? [workspace.episode] : [])
  const [episodesOpen, setEpisodesOpen] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    void api.episodes.listByProject(projectId)
      .then((nextEpisodes) => {
        if (cancelled) return
        setEpisodes(nextEpisodes)
        setLoadError(null)
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(errText(e))
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  const connection = workspace?.connection
  const connectionClass =
    connection === 'open' ? 'is-open' : connection === 'connecting' ? 'is-connecting' : ''
  const connectionLabel =
    connection === 'open' ? '已连接' : connection === 'connecting' ? '连接中' : '已断开'

  return (
    <aside className="workspace-nav">
      <div className="workspace-brand">
        <strong>码上好戏</strong>
        <span>单集快创工作台</span>
      </div>

      <Link to="/projects" className="nav-link">
        ← 项目首页
      </Link>

      {projectId && (
        <nav className="nav-tree" aria-label="项目导航">
          {loadError && <p className="nav-tree-error">{loadError}</p>}
          <div className="nav-tree-section">
            <button
              type="button"
              className="nav-tree-section-head"
              aria-expanded={episodesOpen}
              onClick={() => setEpisodesOpen((open) => !open)}
            >
              {episodesOpen ? <CaretDown size={14} aria-hidden /> : <CaretRight size={14} aria-hidden />}
              <span>分集</span>
            </button>
            {episodesOpen && (
              <div className="nav-tree-children">
                {episodes.map((episode) => (
                  <NavLink
                    key={episode.id}
                    to={`/projects/${projectId}/episodes/${episode.id}`}
                    className={({ isActive }) => `nav-tree-item${isActive ? ' is-active' : ''}`}
                    end
                  >
                    {episode.title}
                  </NavLink>
                ))}
                {episodes.length === 0 && <span className="nav-tree-empty">暂无分集</span>}
              </div>
            )}
          </div>

          <NavLink
            to={`/projects/${projectId}/assets`}
            className={({ isActive }) => `nav-tree-section-head nav-tree-link${isActive ? ' is-active' : ''}`}
          >
            <span>资产库</span>
          </NavLink>

          <NavLink
            to={`/projects/${projectId}/settings`}
            className={({ isActive }) => `nav-tree-section-head nav-tree-link${isActive ? ' is-active' : ''}`}
          >
            <span>项目设置</span>
          </NavLink>
        </nav>
      )}

      {workspace && (
        <div className="workspace-footer">
          <div className="connection-status">
            <span className={`connection-dot ${connectionClass}`} aria-hidden />
            <span>任务连接：{connectionLabel}</span>
          </div>
        </div>
      )}
    </aside>
  )
}
