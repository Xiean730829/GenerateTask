import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Project } from '@/api'
import { errText } from '@/stores/workspace-store'

/** 项目总设置；MS1 只读展示项目元信息。 */
export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    api.projects
      .get(projectId)
      .then((item) => {
        setProject(item)
        setState('ready')
      })
      .catch((e) => {
        setError(errText(e))
        setState('error')
      })
  }, [projectId])

  return (
    <div className="workspace-body project-section-page">
      <header className="section-page-header">
        <h1>项目设置</h1>
        <p className="muted">管理项目级参数与默认配置。</p>
      </header>

      {state === 'loading' && <p className="muted">正在加载项目…</p>}
      {state === 'error' && <div className="inline-error">加载失败：{error}</div>}

      {state === 'ready' && project && (
        <dl className="card settings-dl">
          <div>
            <dt>项目名称</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>画幅</dt>
            <dd>{project.aspectRatio}</dd>
          </div>
          <div>
            <dt>目标时长</dt>
            <dd>{project.targetDurationSec} 秒</dd>
          </div>
          <div>
            <dt>视觉风格</dt>
            <dd>{project.visualStyle ?? '未设置'}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
