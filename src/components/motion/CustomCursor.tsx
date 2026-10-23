import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'

type Variant = 'default' | 'link' | 'label' | 'hidden'

/** Kích thước vòng theo trạng thái (px). */
const RING_SIZE: Record<Variant, number> = {
  default: 32,
  link: 56,
  label: 84,
  hidden: 32,
}

/**
 * Màu vòng theo màu chữ của section đang xem (--page-fg), để luôn thấy được
 * dù nền đen, kem hay đỏ. Đổi màu bằng CSS transition — motion không nội suy
 * được giá trị var().
 */
const RING_STYLE: Record<Variant, React.CSSProperties> = {
  default: { borderColor: 'var(--page-line)', background: 'transparent' },
  link: {
    borderColor: 'var(--page-fg)',
    background: 'color-mix(in srgb, var(--page-fg) 10%, transparent)',
  },
  label: { borderColor: 'var(--page-fg)', background: 'var(--page-fg)', color: 'var(--page-bg)' },
  hidden: { borderColor: 'transparent', background: 'transparent' },
}

/**
 * Con trỏ tùy biến: chấm nhỏ bám sát + vòng tròn trôi theo sau.
 * - Rê lên link/nút → vòng nở ra.
 * - Rê lên phần tử có `data-cursor="Nhãn"` → vòng đặc lại, hiện nhãn.
 * - Rê vào ô nhập liệu → ẩn đi, trả lại con trỏ chữ I của hệ thống.
 *
 * Chỉ bật với chuột thật; màn hình cảm ứng và "giảm chuyển động" giữ con trỏ thường.
 */
export default function CustomCursor() {
  const enabled = useMediaQuery(FINE_POINTER)
  return enabled ? <Cursor /> : null
}

function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 350, damping: 32, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 350, damping: 32, mass: 0.5 })

  const [variant, setVariant] = useState<Variant>('hidden')
  const [label, setLabel] = useState('')
  const [pressed, setPressed] = useState(false)
  // Giữ bản sao để so sánh trong listener mà không phải gắn lại mỗi lần đổi
  const current = useRef({ variant: 'hidden' as Variant, label: '' })

  useEffect(() => {
    // Ẩn con trỏ hệ thống trong lúc con trỏ tùy biến đang chạy (xem index.css)
    document.documentElement.classList.add('has-custom-cursor')

    const update = (next: Variant, nextLabel = '') => {
      if (current.current.variant === next && current.current.label === nextLabel) return
      current.current = { variant: next, label: nextLabel }
      setVariant(next)
      setLabel(nextLabel)
    }

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)

      const target = e.target as Element | null
      const el = target?.closest('[data-cursor], a, button, input, textarea, select')
      if (!el) return update('default')
      if (el.matches('input, textarea, select')) return update('hidden')
      const custom = el.getAttribute('data-cursor')
      if (custom) return update('label', custom)
      update('link')
    }

    // Con trỏ rời cửa sổ → ẩn, tránh vòng tròn đứng trơ ở mép
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) update('hidden')
    }
    const onDown = () => setPressed(true)
    const onUp = () => setPressed(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseout', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseout', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [x, y])

  const size = RING_SIZE[variant]
  const hidden = variant === 'hidden'

  return (
    <>
      {/* Chấm bám sát — ẩn khi vòng đang hiện nhãn để không đè lên chữ */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[101]">
        <motion.div
          className="absolute left-0 top-0 w-1.5 h-1.5 rounded-full bg-page-fg"
          style={{ x, y, translateX: '-50%', translateY: '-50%' }}
          animate={{ opacity: hidden || variant === 'label' ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Vòng trôi theo sau */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
        <motion.div
          className="absolute left-0 top-0 flex items-center justify-center rounded-full border
                     text-[11px] font-medium uppercase tracking-[0.14em]
                     transition-[background-color,border-color] duration-300"
          style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%', ...RING_STYLE[variant] }}
          animate={{
            width: size,
            height: size,
            opacity: hidden ? 0 : 1,
            scale: pressed ? 0.85 : 1,
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            animate={{ opacity: variant === 'label' ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        </motion.div>
      </div>
    </>
  )
}
