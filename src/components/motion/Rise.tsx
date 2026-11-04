// Hiện dần khi cuộn tới, chạy lại cả khi cuộn lên (tách từ trang Giới thiệu, dùng chung).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'

type RiseFrom = { x?: number; y?: number; scale?: number }

/**
 * Hiện dần khi cuộn tới — rõ hơn `Reveal` để giống video tham khảo (references/p6.mp4).
 * Chạy cả khi cuộn xuống lẫn cuộn lên: phần tử ra khỏi khung hẳn thì ẩn lại, lúc quay vào
 * thì chạy lại — vào từ mép dưới thì trồi lên, vào từ mép trên thì trôi xuống.
 * Hiện khi vào khung ~25%, chỉ ẩn khi đã khuất hoàn toàn để không nháy ở mép. Chỉ transform/opacity.
 */
export default function Rise({
  children,
  from = { y: 48 },
  delay = 0,
  duration = 0.9,
  className,
}: {
  children: ReactNode
  from?: RiseFrom
  delay?: number
  duration?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const enough = useInView(ref, { amount: 0.25 })
  const any = useInView(ref, { amount: 0 })
  const [shown, setShown] = useState(false)
  // Hướng vào lại: +1 = từ dưới lên (mặc định), -1 = từ trên xuống
  const [side, setSide] = useState<1 | -1>(1)

  useEffect(() => {
    if (enough) setShown(true)
    else if (!any) {
      setShown(false)
      if (ref.current) setSide(ref.current.getBoundingClientRect().top < 0 ? -1 : 1)
    }
  }, [enough, any])

  if (reduced) return <div className={className}>{children}</div>

  const hidden = { opacity: 0, x: from.x ?? 0, y: (from.y ?? 0) * side, scale: from.scale ?? 1 }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={shown ? { opacity: 1, x: 0, y: 0, scale: 1 } : hidden}
      // Ẩn lúc đã khuất nên không cần chậm; hiện thì theo nhịp + độ trễ của từng phần
      transition={shown ? { duration, delay, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
    >
      {children}
    </motion.div>
  )
}
