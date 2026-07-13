import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AssetLibraryPage } from '@/pages/asset-library/AssetLibraryPage'
import { EpisodeWorkspacePage } from '@/pages/episode-workspace/EpisodeWorkspacePage'
import { ProjectsPage } from '@/pages/home/ProjectsPage'
import { ProjectSettingsPage } from '@/pages/project-settings/ProjectSettingsPage'
import { NewProjectPage } from '@/pages/project-settings/NewProjectPage'
import { ProjectWorkspaceLayout } from '@/pages/project-workspace/ProjectWorkspaceLayout'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/projects" replace /> },
  { path: '/projects', element: <ProjectsPage /> },
  { path: '/projects/new', element: <NewProjectPage /> },
  {
    path: '/projects/:projectId',
    element: <ProjectWorkspaceLayout />,
    children: [
      {
        path: 'episodes/:episodeId',
        element: <EpisodeWorkspacePage />,
      },
      {
        path: 'assets',
        element: <AssetLibraryPage />,
      },
      {
        path: 'settings',
        element: <ProjectSettingsPage />,
      },
    ],
  },
  { path: '*', element: <Navigate to="/projects" replace /> },
])
