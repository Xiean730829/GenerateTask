import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api'
import type { Asset, AssetType } from '@/api'
import { getVoiceAttributes } from '@/api/types/asset'
import { ASSET_TYPE_LABELS, ASSET_TYPE_TABS } from '@/features/asset/asset-labels'
import { errText } from '@/stores/workspace-store'

/** 项目级资产库入口；按角色 / 道具 / 场景 / 风格分类浏览用户级素材。 */
export function AssetLibraryPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [assets, setAssets] = useState<Asset[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<AssetType>('character')

  useEffect(() => {
    api.assets
      .listUserLibrary()
      .then((items) => {
        setAssets(items)
        setState('ready')
      })
      .catch((e) => {
        setError(errText(e))
        setState('error')
      })
  }, [])

  const counts = useMemo(() => {
    const map = Object.fromEntries(ASSET_TYPE_TABS.map((type) => [type, 0])) as Record<AssetType, number>
    for (const asset of assets) map[asset.type] += 1
    return map
  }, [assets])

  const filtered = useMemo(
    () => assets.filter((asset) => asset.type === activeType),
    [assets, activeType],
  )

  return (
    <div className="workspace-body project-section-page">
      <header className="section-page-header">
        <h1>资产库</h1>
        <p className="muted">跨分集复用的角色、道具、场景与风格素材。项目 ID：{projectId}</p>
      </header>

      {state === 'loading' && <p className="muted">正在加载素材…</p>}
      {state === 'error' && <div className="inline-error">加载失败：{error}</div>}

      {state === 'ready' && (
        <>
          <div className="asset-library-tabs" role="tablist" aria-label="资产分类">
            {ASSET_TYPE_TABS.map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={activeType === type}
                className={activeType === type ? 'is-active' : ''}
                onClick={() => setActiveType(type)}
              >
                {ASSET_TYPE_LABELS[type]}
                <span className="asset-library-tab-count">{counts[type]}</span>
              </button>
            ))}
          </div>

          {assets.length === 0 && (
            <div className="card empty-state">
              <p>暂无用户级素材。在分集镜头工作台确认素材后会出现在这里。</p>
            </div>
          )}

          {assets.length > 0 && filtered.length === 0 && (
            <div className="card empty-state">
              <p>当前分类下暂无{ASSET_TYPE_LABELS[activeType]}素材。</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="asset-library-grid" role="tabpanel">
              {filtered.map((asset) => {
                const voice = getVoiceAttributes(asset)
                return (
                  <article key={asset.id} className="card stack asset-library-card">
                    {asset.referenceImageUrl ? (
                      <img className="material-preview" src={asset.referenceImageUrl} alt={asset.name} />
                    ) : (
                      <div className="asset-library-placeholder" aria-hidden />
                    )}
                    <strong>{asset.name}</strong>
                    <span className="muted">{ASSET_TYPE_LABELS[asset.type]}</span>
                    {asset.description && <p className="muted asset-library-desc">{asset.description}</p>}
                    {asset.type === 'character' && voice && (
                      <p className="muted" style={{ fontSize: '0.8125rem' }}>音色：{voice.preset}</p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
