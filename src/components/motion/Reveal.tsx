import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@hooks/useReducedMotion'

type Props = {
  children: ReactNode
  /** Độ trễ tính bằng giây — dùng để stagger nhiều phần tử cạnh nhau. */
  delay?: number
  /** Khoảng dịch chuyển ban đầu theo trục Y (px). */
  y?: number
  className?: string
  /**
   * Chạy ngay khi mount thay vì đợi cuộn tới — dùng cho hero,
   * phần nằm sẵn trong khung nhìn nên `whileInView` không đáng tin.
   */
  immediate?: boolean
  /**
   * Giữ nguyên trạng thái ẩn cho tới khi thành `false`.
   * Dùng khi màn chờ còn che: nếu không, `whileInView` sẽ chạy
   * sau tấm màn và hero hiện ra lúc nào không hay.
   */
  hold?: boolean
}

/** Hiện dần + trôi lên khi cuộn tới. Chỉ chạy một lần. */
export default function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  immediate = false,
  hold = false,
}: Props) {
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  const shown = { opacity: 1, y: 0 }
  const hidden = { opacity: 0, y }

  const trigger = hold
    ? { animate: hidden }
    : immediate
      ? { animate: shown }
      : {
          whileInView: shown,
          viewport: { once: true, margin: '-80px' } as const,
        }

  return (
    <motion.div
      className={className}
      initial={hidden}
      {...trigger}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
