import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api'
import type { AspectRatio } from '@/api'
import { Button } from '@/components/ui/Button'
import { MockBanner } from '@/components/ui/MockBanner'
import { errText } from '@/stores/workspace-store'

const STYLES = ['冷色胶片', '暖色写实', '动画风', '赛博霓虹', '不指定']

export function NewProjectPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [targetDurationSec, setDuration] = useState(45)
  const [aspectRatio, setAspect] = useState<AspectRatio>('9:16')
  const [visualStyle, setStyle] = useState<string>('不指定')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim() && sourceText.trim() && !submitting

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.projects.create({
        name: name.trim(),
        sourceText: sourceText.trim(),
        targetDurationSec,
        aspectRatio,
        visualStyle: visualStyle === '不指定' ? null : visualStyle,
      })
      navigate(`/projects/${res.project.id}/episodes/${res.episodeId}`)
    } catch (e) {
      setError(errText(e))
      setSubmitting(false)
    }
  }

  return (
    <>
      <MockBanner />
      <div className="page page-narrow form-section">
        <button type="button" className="form-back" onClick={() => navigate('/projects')}>
          ← 返回项目首页
        </button>

        <header className="stack" style={{ gap: '0.3rem' }}>
          <h1>新建单集项目</h1>
          <p className="muted">填写基本信息与创作文本，系统将自动开始生成剧本。</p>
        </header>

        <div className="card stack">
          <label className="stack" style={{ gap: '0.35rem' }}>
            <span>项目名称 *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：三年之约" />
          </label>

          <label className="stack" style={{ gap: '0.35rem' }}>
            <span>创作文本 *</span>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={8}
              placeholder="粘贴或写下你的故事梗概 / 大纲……"
            />
          </label>
        </div>

        <div className="card stack">
          <h3 className="muted" style={{ fontSize: '0.875rem', fontWeight: 600 }}>输出设置</h3>
          <div className="grid-3">
            <label className="stack" style={{ gap: '0.35rem' }}>
              <span>目标时长（秒）</span>
              <input
                type="number"
                min={10}
                value={targetDurationSec}
                onChange={(e) => setDuration(Number(e.target.value) || 45)}
              />
            </label>
            <label className="stack" style={{ gap: '0.35rem' }}>
              <span>画幅</span>
              <select value={aspectRatio} onChange={(e) => setAspect(e.target.value as AspectRatio)}>
                <option value="9:16">9:16（竖屏）</option>
                <option value="16:9">16:9（横屏）</option>
                <option value="1:1">1:1（方形）</option>
              </select>
            </label>
            <label className="stack" style={{ gap: '0.35rem' }}>
              <span>视觉风格（可选）</span>
              <select value={visualStyle} onChange={(e) => setStyle(e.target.value)}>
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <div className="inline-error">{error}</div>}

        <div className="form-actions">
          <Button variant="primary" disabled={!canSubmit} onClick={() => void submit()}>
            {submitting ? '正在创建…' : '开始生成剧本'}
          </Button>
          <span className="muted" style={{ fontSize: '0.8125rem' }}>
            点击后创建项目、默认单集与输入材料，并启动剧本生成任务。
          </span>
        </div>
      </div>
    </>
  )
}
