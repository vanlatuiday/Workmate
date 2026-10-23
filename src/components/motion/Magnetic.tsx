import { useRef, type ReactNode } from 'react'
import { motion, useSpring } from 'motion/react'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'

type Props = {
  children: ReactNode
  /** Tỉ lệ bám theo con trỏ — 0.3 nghĩa là lệch 30% khoảng cách tới tâm. */
  strength?: number
  className?: string
}

const SPRING = { stiffness: 220, damping: 16, mass: 0.4 }

/** Kéo phần tử con nhích về phía con trỏ khi rê chuột lên, nảy về chỗ cũ khi rời đi. */
export default function Magnetic({ children, strength = 0.3, className }: Props) {
  const enabled = useMediaQuery(FINE_POINTER)
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, SPRING)
  const y = useSpring(0, SPRING)

  if (!enabled) return <div className={cn('inline-block', className)}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        // Trừ phần đang lệch để tính theo vị trí gốc, tránh tâm bị trôi theo
        const rect = ref.current!.getBoundingClientRect()
        const cx = rect.left - x.get() + rect.width / 2
        const cy = rect.top - y.get() + rect.height / 2
        x.set((e.clientX - cx) * strength)
        y.set((e.clientY - cy) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
