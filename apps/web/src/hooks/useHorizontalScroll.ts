import { useCallback, useRef } from 'react'

const DRAG_THRESHOLD = 5

function scrollProgress(node: HTMLElement) {
  const maxScroll = node.scrollWidth - node.clientWidth
  if (maxScroll <= 0) return { progress: 0, scrollable: false }
  return { progress: (node.scrollLeft / maxScroll) * 100, scrollable: true }
}

/** 横向滚动容器：按住拖动 + 滚轮（含纵向滚轮转横向）。 */
export function useHorizontalScroll<T extends HTMLElement>(options?: {
  onScrollProgress?: (progress: number, scrollable: boolean) => void
}) {
  const cleanupRef = useRef<(() => void) | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const setRef = useCallback((node: T | null) => {
    cleanupRef.current?.()
    cleanupRef.current = null
    if (!node) return

    const emitProgress = () => {
      const { progress, scrollable } = scrollProgress(node)
      optionsRef.current?.onScrollProgress?.(progress, scrollable)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return

      const startX = e.clientX
      const startScrollLeft = node.scrollLeft
      let dragging = false

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startX
        if (!dragging) {
          if (Math.abs(dx) < DRAG_THRESHOLD) return
          dragging = true
          node.classList.add('is-drag-scrolling')
        }
        moveEvent.preventDefault()
        node.scrollLeft = startScrollLeft - dx
        emitProgress()
      }

      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.removeEventListener('pointercancel', onUp)

        if (dragging) {
          const blockClick = (clickEvent: MouseEvent) => {
            clickEvent.preventDefault()
            clickEvent.stopImmediatePropagation()
            node.removeEventListener('click', blockClick, true)
          }
          node.addEventListener('click', blockClick, true)
        }

        node.classList.remove('is-drag-scrolling')
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onUp)
    }

    const onWheel = (e: WheelEvent) => {
      const maxScroll = node.scrollWidth - node.clientWidth
      if (maxScroll <= 0) return

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return

      e.preventDefault()
      e.stopPropagation()
      node.scrollLeft = Math.min(maxScroll, Math.max(0, node.scrollLeft + delta))
      emitProgress()
    }

    const onScroll = () => emitProgress()
    const resizeObserver = new ResizeObserver(() => emitProgress())

    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('wheel', onWheel, { passive: false, capture: true })
    node.addEventListener('scroll', onScroll, { passive: true })
    resizeObserver.observe(node)
    for (const child of node.children) resizeObserver.observe(child)

    emitProgress()

    cleanupRef.current = () => {
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('wheel', onWheel, { capture: true })
      node.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  return setRef
}
