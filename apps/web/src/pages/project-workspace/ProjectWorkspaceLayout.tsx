import { Outlet } from 'react-router-dom'
import { MockBanner } from '@/components/ui/MockBanner'
import { WorkspaceSidebar } from '@/features/episode/WorkspaceSidebar'

export function ProjectWorkspaceLayout() {
  return (
    <>
      <MockBanner />
      <div className="narrow-only narrow-screen">
        <h2>请在更宽的屏幕上打开</h2>
        <p className="muted" style={{ maxWidth: '40ch' }}>
          完整创作工作台面向最小宽度 1024px 的桌面端。窄屏仅提供项目状态与预览，
          请使用桌面浏览器进行编辑与生产操作。
        </p>
      </div>
      <div className="workspace">
        <WorkspaceSidebar />
        <div className="workspace-main">
          <Outlet />
        </div>
      </div>
    </>
  )
}
