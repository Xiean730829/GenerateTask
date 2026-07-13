// Mock adapter：实现与真实 API 完全相同的 ApiClient 契约。
// 页面 / feature / store 只通过 adapter 选择入口拿到它，不直接 import 本文件的实现细节。
import type { ApiClient } from '@/api/contracts'
import { mockEpisodeTaskEventSource } from './event-source'
import { mockAssetService } from './services/asset'
import { mockEpisodeService } from './services/episode'
import { mockExportService } from './services/export'
import { mockKeyframeService } from './services/keyframe'
import { mockPanelService } from './services/panel'
import { mockPanelVideoService } from './services/panel-video'
import { mockProjectService } from './services/project'
import { mockScriptService } from './services/script'
import { mockShotService } from './services/shot'
import { mockSourceMaterialService } from './services/source-material'
import { mockTaskService } from './services/task'
import { mockTimelineService } from './services/timeline'

export function createMockApiClient(): ApiClient {
  return {
    projects: mockProjectService,
    episodes: mockEpisodeService,
    sourceMaterials: mockSourceMaterialService,
    scripts: mockScriptService,
    shots: mockShotService,
    assets: mockAssetService,
    keyframes: mockKeyframeService,
    panels: mockPanelService,
    panelVideos: mockPanelVideoService,
    timelines: mockTimelineService,
    exports: mockExportService,
    tasks: mockTaskService,
    taskEvents: mockEpisodeTaskEventSource,
  }
}
