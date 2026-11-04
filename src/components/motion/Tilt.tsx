import { useRef, type ReactNode } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'

type Props = {
  children: ReactNode
  /** Góc nghiêng tối đa (độ) theo mỗi trục. */
  max?: number
  /** Ảnh bên trong (`[data-tilt-media]`) lệch ngược chiều tối đa bấy nhiêu px. */
  shift?: number
  className?: string
}

const SPRING = { stiffness: 180, damping: 20, mass: 0.4 }

/**
 * Nghiêng phần tử con theo con trỏ (có phối cảnh); thẻ trả về thẳng khi rời đi.
 * Phần tử `[data-tilt-media]` bên trong (ảnh) lệch ngược chiều + phóng nhẹ để không lộ mép.
 * Giá trị chạy qua MotionValue — không setState mỗi lần di chuột. Chỉ bật với chuột thật
 * và khi không tắt chuyển động; ngoài ra chỉ render phần tử con.
 */
export default function Tilt({ children, max = 4.5, shift = 6, className }: Props) {
  const enabled = useMediaQuery(FINE_POINTER)
  if (!enabled) return <div className={className}>{children}</div>
  return (
    <TiltBox max={max} shift={shift} className={className}>
      {children}
    </TiltBox>
  )
}

function TiltBox({ children, max, shift, className }: Required<Omit<Props, 'children' | 'className'>> & Pick<Props, 'children' | 'className'>) {
  const ref = useRef<HTMLDivElement>(null)
  // px, py ∈ [-1, 1]: vị trí con trỏ so với tâm thẻ
  const px = useSpring(0, SPRING)
  const py = useSpring(0, SPRING)
  const rotateY = useTransform(px, (v) => v * max)
  const rotateX = useTransform(py, (v) => -v * max)
  const mx = useTransform(px, (v) => -v * shift)
  const my = useTransform(py, (v) => -v * shift)

  return (
    <motion.div
      ref={ref}
      // Biến CSS để ảnh con đọc được mà không cần bọc thêm component
      style={{ rotateX, rotateY, transformPerspective: 800, '--tilt-x': mx, '--tilt-y': my } as never}
      className={cn('h-full will-change-transform [&_[data-tilt-media]]:[transform:translate3d(calc(var(--tilt-x,0)*1px),calc(var(--tilt-y,0)*1px),0)_scale(1.04)]', className)}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        px.set(((e.clientX - r.left) / r.width - 0.5) * 2)
        py.set(((e.clientY - r.top) / r.height - 0.5) * 2)
      }}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
