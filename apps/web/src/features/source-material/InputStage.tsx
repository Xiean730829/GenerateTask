import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { StageHeader } from '@/features/episode/StageHeader'
import { useWorkspaceSelector, useWorkspaceStore } from '@/stores/workspace-context'

/** 输入阶段：展示 / 编辑本集输入材料（纯文本）。 */
export function InputStage() {
  const store = useWorkspaceStore()
  const sourceMaterial = useWorkspaceSelector((s) => s.sourceMaterial)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(sourceMaterial?.text ?? '')
  }, [sourceMaterial?.id])

  const dirty = sourceMaterial ? text !== sourceMaterial.text : false

  const save = async () => {
    if (!sourceMaterial) return
    setSaving(true)
    try {
      await store.saveSourceMaterial(text)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <StageHeader
        title="输入材料"
        desc="驱动本集创作的原始文本。修改后需重新生成剧本方可生效。"
        actions={
          <Button variant="primary" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? '保存中…' : '保存文本'}
          </Button>
        }
      />
      <textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} />
    </section>
  )
}
