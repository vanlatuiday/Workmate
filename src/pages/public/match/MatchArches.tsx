import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'

/** Một khối vòm: vị trí hai bên mép màn hình, kích thước, kiểu tô, biên độ trôi (px) */
const ARCHES = [
  { pos: '-left-16 top-[18%] h-80 w-44', fill: 'bg-wm-stone opacity-40', drift: 22, phase: 0 },
  { pos: 'left-6 bottom-[-4rem] h-52 w-28', fill: 'border border-page-line opacity-70', drift: 14, phase: 1.6 },
  { pos: '-right-12 top-[34%] h-96 w-48', fill: 'bg-wm-stone opacity-30', drift: 26, phase: 0.8 },
  { pos: 'right-10 top-20 h-44 w-24', fill: 'border border-page-line opacity-70', drift: 12, phase: 2.4 },
] as const

/**
 * Vài khối vòm mờ màu đá ở hai mép màn hình (chỉ từ lg, chỉ ở chế độ Bộ sưu tập) — gợi không
 * gian phòng trưng bày. Cố định theo khung nhìn, nằm DƯỚI nội dung (nội dung của trang phải
 * `relative z-10`), bị cắt tại mép trên footer. Trôi rất nhẹ theo cuộn bằng transform;
 * "giảm chuyển động" thì đứng yên.
 */
export default function MatchArches() {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    const footer = document.querySelector('footer')
    const update = () => {
      raf = 0
      // Cắt các khối ở mép trên footer — lớp này cố định nên nếu không sẽ đè lên footer
      const wrap = wrapRef.current
      if (wrap && footer) {
        const hidden = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top)
        wrap.style.clipPath = hidden ? `inset(0 0 ${hidden}px 0)` : ''
      }
      if (reduced) return
      const y = window.scrollY
      refs.current.forEach((el, i) => {
        if (!el) return
        // Dao động có biên theo vị trí cuộn: khối chỉ lắc nhẹ, không trôi khỏi màn hình
        el.style.transform = `translate3d(0, ${Math.sin(y / 700 + ARCHES[i].phase) * ARCHES[i].drift}px, 0)`
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      refs.current.forEach((el) => el && (el.style.transform = ''))
    }
  }, [reduced])

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden lg:block">
      {ARCHES.map((a, i) => (
        <div
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={cn('absolute rounded-t-full will-change-transform', a.pos, a.fill)}
        />
      ))}
    </div>
  )
}
