import type { Id } from '@/api'

/** MS1：由 mediaFileId 生成确定性占位图（mock / 无 CDN 时 UI 预览用）。 */
export function mediaUrlFromId(mediaFileId: Id): string {
  let hash = 0
  for (let i = 0; i < mediaFileId.length; i += 1) {
    hash = (hash * 31 + mediaFileId.charCodeAt(i)) | 0
  }
  const hue = Math.abs(hash) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='320'><rect width='100%' height='100%' fill='hsl(${hue} 30% 22%)'/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
