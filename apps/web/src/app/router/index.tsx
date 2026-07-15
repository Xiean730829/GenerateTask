import { createBrowserRouter } from 'react-router-dom'

function BootstrapPage() {
  return (
    <main>
      <h1>码上好戏</h1>
      <p>Web 应用骨架已就绪。</p>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main>
      <h1>页面不存在</h1>
      <p>请返回应用首页。</p>
    </main>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <BootstrapPage /> },
  { path: '*', element: <NotFoundPage /> },
])
