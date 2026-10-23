import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useExperienceStore } from '@context/experienceStore'
import RollText from '@components/motion/RollText'

export type MenuItem = { label: string; href: string }

type Props = {
  open: boolean
  onClose: () => void
  items: MenuItem[]
  /** Hiện dưới danh sách chính — đăng nhập / đăng ký hoặc dashboard. */
  actions: MenuItem[]
}

/** Menu phủ toàn màn hình, link đánh số 01–0n. */
export default function MenuOverlay({ open, onClose, items, actions }: Props) {
  const reduced = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { quality, setQuality } = useExperienceStore()

  // Esc để đóng + giam tiêu điểm bàn phím trong lớp phủ
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Khóa cuộn nền và đưa tiêu điểm vào nút đóng
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const duration = reduced ? 0 : 0.7

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-[90] bg-wm-charcoal flex flex-col"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="shell w-full flex items-center justify-between h-16 shrink-0">
            <span className="eyebrow text-wm-sage">Menu</span>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Đóng menu"
              className="p-2 -mr-2 text-wm-stone hover:text-wm-ivory transition-colors rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="shell w-full flex-1 flex flex-col justify-center overflow-y-auto py-8">
            <ul>
              {items.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '110%' }}
                    transition={{
                      duration: reduced ? 0 : 0.7,
                      delay: reduced ? 0 : 0.18 + i * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className="group flex w-full items-baseline gap-5 md:gap-8 py-2 md:py-3"
                    >
                      <span className="text-xs text-wm-sage tnum shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="font-display text-display-sm font-semibold text-wm-mist
                                   group-hover:text-wm-ivory transition-colors duration-300"
                      >
                        <RollText>{item.label}</RollText>
                      </span>
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            className="shell w-full pb-10 flex flex-wrap items-center gap-3 shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.5 }}
          >
            {actions.map((action, i) => (
              <Link
                key={action.href}
                to={action.href}
                onClick={onClose}
                className={
                  i === actions.length - 1
                    ? 'bg-wm-ivory text-wm-charcoal font-medium text-sm px-7 py-3 rounded-full hover:bg-wm-mist transition-colors'
                    : 'border border-wm-graphite text-wm-ivory font-medium text-sm px-7 py-3 rounded-full hover:border-wm-stone transition-colors'
                }
              >
                {action.label}
              </Link>
            ))}

            {/* Chất lượng hiệu ứng nền WebGL — vô nghĩa khi đã tắt chuyển động */}
            {!reduced && (
              <button
                type="button"
                onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
                className="ml-auto text-xs uppercase tracking-[0.18em] text-wm-sage hover:text-wm-ivory transition-colors"
              >
                Chất lượng <span className="text-wm-ivory">{quality === 'high' ? 'Cao' : 'Thấp'}</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

