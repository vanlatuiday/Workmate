import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'

type Props = {
  /** Gọi khi màn chờ đã biến mất hẳn — dùng để khởi động animation hero. */
  onDone: () => void
}

/** Chỉ chạy màn chờ ở lần vào đầu tiên của phiên, không lặp lại khi quay về trang chủ. */
const SEEN_KEY = 'wm:preloader-seen'

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* chế độ riêng tư chặn sessionStorage — bỏ qua */
  }
}

export default function Preloader({ onDone }: Props) {
  const reduced = useReducedMotion()
  // Quyết định hiển thị ngay ở lần render đầu để tránh nháy màn hình
  const [visible, setVisible] = useState(() => !alreadySeen())
  const [percent, setPercent] = useState(0)

  // Bỏ qua màn chờ nếu đã xem rồi hoặc người dùng tắt chuyển động
  useEffect(() => {
    if (!visible || reduced) {
      if (visible) setVisible(false)
      markSeen()
      onDone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Đếm 0 → 100
  useEffect(() => {
    if (!visible || reduced) return

    const duration = 1500
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      // easeOutExpo — nhanh lúc đầu, chậm dần về đích
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setPercent(Math.round(eased * 100))

      if (p < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        markSeen()
        setVisible(false)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [visible, reduced])

  // Khóa cuộn trang khi màn chờ còn hiện
  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-ink-900 flex items-end justify-between
                     px-6 md:px-10 lg:px-16 pb-10 pointer-events-none"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <span className="font-display text-display-md font-semibold text-white tnum leading-none">
            {String(percent).padStart(3, '0')}
          </span>
          <span className="eyebrow text-ink-400 mb-2">Workmate</span>

          {/* Vạch tiến trình chạy ngang đáy màn hình */}
          <motion.span
            className="absolute left-0 bottom-0 h-px bg-ink-600 origin-left"
            style={{ width: '100%' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: percent / 100 }}
            transition={{ ease: 'linear', duration: 0.1 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
