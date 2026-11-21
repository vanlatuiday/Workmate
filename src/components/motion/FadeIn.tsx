import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@utils/cn'
import { useIsDay } from '@components/layout/dayContext'

type Props = {
  children: ReactNode
  /** Trễ (ms) để các phần tử cạnh nhau hiện lần lượt; nên ≤ 240 */
  delay?: number
  className?: string
  as?: ElementType
  /** Kiểu trang ban ngày (trồi 28px, 800ms). Mặc định tự bật khi nằm trong trang ban ngày của PublicLayout */
  day?: boolean
}

/**
 * Hiệu ứng "hiện ra khi cuộn tới" dùng chung cho mọi trang, kể cả dashboard (DESIGN.md → Motion):
 * mờ → rõ + trôi lên 12px, 500ms, một lần. Chỉ CSS + IntersectionObserver, không theo tiến trình cuộn.
 * Giảm chuyển động / trình duyệt cũ / chưa chạy JS: hiện ngay, không ẩn nội dung.
 * Trang chủ có hiệu ứng riêng (GSAP) — không dùng component này ở đó.
 */
export default function FadeIn({ children, delay = 0, className, as: Tag = 'div', day }: Props) {
  const inDay = useIsDay()
  const slow = day ?? inDay
  const ref = useRef<HTMLElement>(null)
  // Mặc định đã hiện: chỉ ẩn khi chắc chắn sẽ có observer làm hiện lại
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Đã nằm trong khung nhìn lúc mount (đầu trang): không làm hiệu ứng để khỏi nháy
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.9) return
    setState('hidden')
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setState('shown')
        io.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    // Lúc mount trang mới có thể còn đang trong hiệu ứng chuyển trang (vị trí chưa đúng) nên observer có thể
    // không báo lại cho phần tử đã nằm trong khung nhìn → kiểm tra lại sau khi chuyển trang xong
    const recheck = () => {
      const b = el.getBoundingClientRect()
      if (b.top < window.innerHeight && b.bottom > 0) {
        setState('shown')
        io.disconnect()
      }
    }
    const timers = [700, 1400].map((ms) => window.setTimeout(recheck, ms))
    return () => {
      io.disconnect()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      style={state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        state !== 'idle' && 'transition-[opacity,transform] ease-editorial motion-reduce:transition-none', slow ? 'duration-[800ms]' : 'duration-slow',
        state === 'hidden' && (slow ? 'translate-y-7 opacity-0' : 'translate-y-3 opacity-0'),
        className,
      )}
    >
      {children}
    </Tag>
  )
}
