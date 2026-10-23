import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'

type Props = {
  value: number
  /** Hậu tố hiển thị sau số, ví dụ "+" hoặc "%". */
  suffix?: string
  duration?: number
  className?: string
}

/** Đếm từ 0 lên `value` khi cuộn tới. */
export default function Counter({ value, suffix = '', duration = 1600, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutExpo — chạy nhanh rồi chậm dần về đích
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('vi-VN')}
      {suffix}
    </span>
  )
}
