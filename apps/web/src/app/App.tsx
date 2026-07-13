import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import '@/styles/components.css'
import '@/styles/layout.css'

export function App() {
  return <RouterProvider router={router} />
}
