import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'

/** 可拖动、滚轮横向滚动的容器，用于胶卷等横向列表。 */
export function HorizontalScroll({
  className = '',
  children,
  bleed = false,
  showProgress = bleed,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; bleed?: boolean; showProgress?: boolean }) {
  const [progress, setProgress] = useState(0)
  const [scrollable, setScrollable] = useState(false)
  const setRef = useHorizontalScroll<HTMLDivElement>({
    onScrollProgress: (value, canScroll) => {
      setProgress(value)
      setScrollable(canScroll)
    },
  })
  const classes = ['horizontal-scroll', className].filter(Boolean).join(' ')

  const scroll = (
    <div ref={setRef} className={classes} {...rest}>
      {children}
    </div>
  )

  const progressBar = showProgress && scrollable ? (
    <div
      className="scroll-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="横向滚动进度"
      aria-orientation="vertical"
    >
      <span className="scroll-progress-fill" style={{ height: `${progress}%` }} />
    </div>
  ) : null

  if (bleed) {
    return (
      <div className="scroll-bleed-wrap">
        <div className={`scroll-bleed-viewport${progressBar ? ' has-scroll-progress' : ''}`}>
          {scroll}
          {progressBar}
        </div>
      </div>
    )
  }

  if (progressBar) {
    return (
      <div className="scroll-with-progress">
        {scroll}
        {progressBar}
      </div>
    )
  }

  return scroll
}
