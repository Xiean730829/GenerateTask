import type { StageKey } from '@/api'
import { InputStage } from '@/features/source-material/InputStage'
import { ScriptStage } from '@/features/script/ScriptStage'
import { ShotStage } from '@/features/shot/ShotStage'
import { PanelStage } from '@/features/panel/PanelStage'
import { TimelineStage } from '@/features/timeline/TimelineStage'
import { ExportStage } from '@/features/export/ExportStage'

/** 中间主画布：按当前阶段渲染对应生产面板。 */
export function StageCanvas({
  stage,
  onNavigate,
}: {
  stage: StageKey
  onNavigate: (s: StageKey) => void
}) {
  switch (stage) {
    case 'input':
      return <InputStage />
    case 'script':
      return <ScriptStage onNext={() => onNavigate('shot')} />
    case 'shot':
      return <ShotStage onNext={() => onNavigate('panel')} />
    case 'panel':
      return <PanelStage onNext={() => onNavigate('timeline')} />
    case 'timeline':
      return <TimelineStage onNext={() => onNavigate('export')} />
    case 'export':
      return <ExportStage />
  }
}
