import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FilmStrip } from '@phosphor-icons/react'
import { api } from '@/api'
import type { ProjectSummary } from '@/api'
import { Button } from '@/components/ui/Button'
import { MockBanner } from '@/components/ui/MockBanner'
import { errText } from '@/stores/workspace-store'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.projects
      .listRecent()
      .then((items) => {
        setProjects(items)
        setState('ready')
      })
      .catch((e) => {
        setError(errText(e))
        setState('error')
      })
  }, [])

  return (
    <>
      <MockBanner />
      <div className="page stack" style={{ gap: '1.75rem' }}>
        <header className="page-hero page-header">
          <div>
            <div className="page-hero-brand">
              <div className="page-hero-brand-icon">
                <FilmStrip size={22} />
              </div>
              <strong>码上好戏</strong>
            </div>
            <h1 className="page-hero-title">单集快创工作台</h1>
            <p className="page-hero-desc">
              从创作文本到视频导出，逐步确认剧本、镜头与关键帧，完成一部短剧。
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/projects/new')}>
            新建单集项目
          </Button>
        </header>

        {state === 'loading' && (
          <div className="card muted" style={{ textAlign: 'center', padding: '2rem' }}>
            正在加载项目…
          </div>
        )}

        {state === 'error' && <div className="inline-error">加载失败：{error}</div>}

        {state === 'ready' && projects.length === 0 && (
          <div className="card empty-state stack">
            <div className="empty-state-icon">
              <FilmStrip size={28} />
            </div>
            <h3>还没有项目</h3>
            <p className="muted" style={{ maxWidth: '36ch', margin: '0 auto' }}>
              从一段创作文本开始，几步生成你的第一部单集短剧。
            </p>
            <div className="row" style={{ justifyContent: 'center', marginTop: '0.35rem' }}>
              <Button variant="primary" onClick={() => navigate('/projects/new')}>
                新建单集项目
              </Button>
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <section className="stack">
            <h2 className="section-title">最近项目</h2>
            <div className="project-grid">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}/episodes/${p.defaultEpisodeId}`}
                  className="card card-interactive project-card"
                >
                  <span className="project-card-name">{p.name}</span>
                  <div className="project-card-meta">
                    <span className="badge badge-pending">{p.aspectRatio}</span>
                    <span className="badge badge-active">{p.stageLabel}</span>
                  </div>
                  <div className="project-card-footer">
                    <span>继续创作</span>
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
