import { useLayoutEffect, useRef, type ReactNode } from 'react'
import PageCover from '@components/common/PageCover'
import { ScrollTrigger } from '@utils/gsap'
import { scrollToY } from '@hooks/useSmoothScroll'

type Props = {
  title: string
  fact: ReactNode
  stats: [number, string][]
  children: ReactNode
  category: string
}

/** Bìa trang Việc làm với bộ lọc và thông báo số kết quả cho trình đọc màn hình. */
export default function JobsHero({ title, fact, stats, children, category }: Props) {
  const previousCategory = useRef(category)

  useLayoutEffect(() => {
    if (previousCategory.current === category) return
    previousCategory.current = category
    scrollToY(0)
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [category])

  return (
    <>
      <PageCover level="md" centered title={title} fact={fact}>
        {children}
      </PageCover>
      <p className="sr-only" role="status" aria-live="polite">
        {stats.map(([value, label]) => `${value} ${label}`).join(', ')}
      </p>
    </>
  )
}
