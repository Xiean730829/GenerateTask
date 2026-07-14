import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FilmStrip, Plus } from '@phosphor-icons/react'
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
      <div className="home-landing">
        <section className="home-hero-scene">
          <div className="home-hero-media" aria-hidden>
            <img src="/images/hero-coast.png" alt="" className="home-hero-img" />
            <div className="home-hero-blur" />
            <div className="home-hero-fade" />
          </div>

          <div className="home-shell">
            <header className="home-hero-intro">
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
            </header>

            <div className="home-cta-card card">
              <div className="home-cta-copy">
                <p className="home-cta-greeting">开始你的创作</p>
                <p className="home-cta-hint muted">
                  粘贴一段故事梗概，几步生成剧本、镜头与关键帧。
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate('/projects/new')}>
                <Plus size={18} aria-hidden />
                新建单集项目
              </Button>
            </div>
          </div>
        </section>

        <div className="home-body">
          {state === 'loading' && (
            <div className="card muted home-status-card">正在加载项目…</div>
          )}

          {state === 'error' && <div className="inline-error">加载失败：{error}</div>}

          {state === 'ready' && projects.length === 0 && (
            <p className="home-empty-hint muted">暂无历史项目，从上方开始你的第一部短剧。</p>
          )}

          {projects.length > 0 && (
            <section className="home-projects">
              <h2 className="section-title">最近项目</h2>
              <div className="project-grid">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}/episodes/${p.defaultEpisodeId}`}
                    className="project-gallery-card"
                  >
                    <div className="project-gallery-cover">
                      <img src={p.coverUrl} alt="" loading="lazy" />
                    </div>
                    <div className="project-gallery-caption">
                      <span className="project-gallery-name">{p.name}</span>
                      <span className="project-gallery-meta muted">{p.stageLabel}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
