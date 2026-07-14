// 运行时冒烟测试：驱动 mock 客户端跑完整单集快创闭环，断言状态与事件正确推进。
import { createMockApiClient } from '@/mocks'
import type { GenerationTask, Id } from '@/api'
import { groupKeyframesByShot } from '@/api/types/keyframe'
import { getVoiceAttributes } from '@/api/types/asset'
import { isTimelineFresh } from '@/api/types/timeline'

const api = createMockApiClient()

function waitTask(episodeId: Id, taskId: Id): Promise<GenerationTask> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`任务超时：${taskId}`)), 8000)
    const unsub = api.taskEvents.subscribe(episodeId, (ev) => {
      if (ev.data.id !== taskId) return
      if (['succeeded', 'failed', 'canceled'].includes(ev.data.status)) {
        clearTimeout(timeout)
        unsub()
        resolve(ev.data)
      }
    })
  })
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`断言失败：${msg}`)
  console.log(`  ✓ ${msg}`)
}

async function main() {
  console.log('1. 创建项目并生成剧本')
  const created = await api.projects.create({
    name: '冒烟测试',
    sourceText: '一个关于重逢的故事',
    targetDurationSeconds: 45,
    aspectRatio: '9:16',
    style: '冷色胶片',
  })
  const ep = created.defaultEpisode.id
  await waitTask(ep, created.scriptTaskId!)
  const script = await api.scripts.getByEpisode(ep)
  assert(script?.status === 'draft' && script.content.length > 0, '剧本生成完成且可编辑')

  console.log('2. 确认剧本 → 生成镜头')
  const { taskId: shotTask } = await api.scripts.confirmAndGenerateShots(script!.id)
  await waitTask(ep, shotTask)
  const shots = await api.shots.listByEpisode(ep)
  assert(shots.length > 0, `生成 ${shots.length} 个镜头`)

  console.log('3. 按镜头自动识别素材，用户确认后生成参考图')
  for (const shot of shots) {
    const { taskId: prepareTask } = await api.assets.prepareForShot(shot.id)
    await waitTask(ep, prepareTask)
    const materials = await api.assets.listForShot(shot.id)
    assert(materials.length > 0, `镜头 ${shot.orderIndex + 1} 已关联素材`)
    for (const asset of materials) {
      let current = (await api.assets.listForShot(shot.id)).find((item) => item.id === asset.id)!
      if (!current.currentRevisionId) {
        await api.assets.createRevision(current.id)
        current = (await api.assets.listForShot(shot.id)).find((item) => item.id === asset.id)!
      }
      if (!current.referenceImageUrl) {
        const { taskId } = await api.assets.generateReferenceImage(current.id)
        await waitTask(ep, taskId)
      }
    }
  }
  const assets = await api.assets.listUserLibrary()
  const chars = assets.filter((a) => a.type === 'character')
  assert(chars.every((c) => getVoiceAttributes(c) !== null), '角色资产携带音色字段')
  assert(!assets.some((a) => a.type === 'voice' as never), '不存在独立音色资产')

  console.log('4. 固定关键帧批次：不足 9 个镜头时仍生成一张九宫格并保留空格')
  const { taskId: keyframeTask, shotIds } = await api.keyframes.generateNextBatch(ep)
  assert(shotIds.length === shots.length, `${shots.length} 个镜头进入同一张九宫格任务`)
  await waitTask(ep, keyframeTask)
  const grouped = groupKeyframesByShot(await api.keyframes.listByEpisode(ep))
  for (const shot of shots) {
    const entry = grouped.find((k) => k.shotId === shot.id)
    await api.keyframes.select(entry!.candidates[0].id)
  }
  const kfs = groupKeyframesByShot(await api.keyframes.listByEpisode(ep))
  assert(kfs.every((k) => k.selectedKeyframeId), '每个镜头均已选定关键帧')

  console.log('5. 贪心组装 Panel')
  const panels = await api.panels.assemble(ep)
  const cap = await api.episodes.getVideoCapability(ep)
  assert(panels.length > 0, `组装出 ${panels.length} 个 Panel`)
  assert(panels.every((p) => (p.durationSeconds ?? 0) <= cap.maxPanelDurationSeconds), `每个 Panel ≤ ${cap.maxPanelDurationSeconds}s 上限`)

  console.log('6. 批量生成 Panel 视频（含首个失败→重试）')
  const { taskIds: vTasks } = await api.panelVideos.generateBatch(ep)
  const results = await Promise.all(vTasks.map((t) => waitTask(ep, t)))
  const failed = results.filter((r) => r.status === 'failed')
  assert(failed.length === 1 && failed[0].retryable, '演示了一次可重试失败')
  const retried = await api.tasks.retry(failed[0].id)
  await waitTask(ep, retried.id)
  const videos = await api.panelVideos.listByEpisode(ep)
  assert(videos.every((v) => v.status === 'succeeded'), '重试后全部 Panel 视频有效')

  console.log('7. 生成音字幕并合成时间线 → 导出')
  const { taskId: audioTask } = await api.timelines.generateAudioSubtitle(ep)
  await waitTask(ep, audioTask)
  const tl = await api.timelines.compose(ep)
  assert(isTimelineFresh(tl) && tl.videoTrack.length === panels.length, '时间线合成完成')
  const { taskId: expTask } = await api.exports.create(ep, { format: 'mp4', aspectRatio: '9:16', resolution: '720p' })
  await waitTask(ep, expTask)
  const record = await api.exports.getByEpisode(ep)
  assert(record?.status === 'succeeded' && !!record.fileUrl, '导出完成且有下载地址')

  console.log('8. 下游失效：改镜头 → Panel 视频与时间线失效')
  await api.shots.update(shots[0].id, { durationSeconds: (shots[0].durationSeconds ?? 0) + 1 })
  const videosAfter = await api.panelVideos.listByEpisode(ep)
  const tlAfter = await api.timelines.getByEpisode(ep)
  assert(videosAfter.some((v) => v.status === 'stale'), '受影响 Panel 视频被标记失效')
  assert(tlAfter?.status === 'stale', '时间线被标记失效')

  console.log('\n✅ 全部冒烟断言通过')
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('\n❌', e.message)
  process.exit(1)
})
