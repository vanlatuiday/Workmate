import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useExperienceStore } from '@context/experienceStore'
import RollText from '@components/motion/RollText'

export type MenuItem = { label: string; href: string }
/** Nút cuối menu: link (href) hoặc hành động (onClick, vd. Đăng xuất) */
export type MenuAction = { label: string; href?: string; onClick?: () => void }

type Props = {
  /** id để nút mở menu trỏ tới bằng aria-controls */
  id?: string
  open: boolean
  onClose: () => void
  items: MenuItem[]
  /** Hiện dưới danh sách chính — đăng nhập / đăng ký hoặc dashboard. */
  actions: MenuAction[]
}

/** Menu phủ toàn màn hình, link đánh số 01–0n. */
export default function MenuOverlay({ id, open, onClose, items, actions }: Props) {
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
    // Trả tiêu điểm về nút đã mở menu khi đóng
    const opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [open])

  const duration = reduced ? 0 : 0.35

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="theme-night fixed inset-0 z-[90] flex flex-col bg-wm-night"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex h-[72px] w-full shrink-0 items-center justify-between px-5 md:px-8">
            <span className="eyebrow text-wm-sage">Menu</span>
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Đóng menu"
              className="p-2 -mr-2 text-wm-stone hover:text-wm-ivory transition-colors rounded-control"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav aria-label="Menu điều hướng" className="flex w-full flex-1 flex-col justify-center overflow-y-auto px-5 py-8 md:px-8">
            <ul>
              {items.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '110%' }}
                    transition={{
                      duration: reduced ? 0 : 0.7,
                      delay: reduced ? 0 : 0.15 + i * 0.07,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className="group flex w-full items-baseline gap-5 py-1.5 md:gap-8 md:py-2.5"
                    >
                      <span className="text-xs text-wm-sage tnum shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="font-display text-[clamp(1.875rem,8.5vw,3.25rem)] font-medium leading-[1.25] text-wm-mist
                                   group-hover:text-wm-ivory transition-colors duration-fast"
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
            className="flex w-full shrink-0 flex-wrap items-center gap-3 px-5 pb-10 md:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.5 }}
          >
            {actions.map((action, i) => {
              const cls =
                i === actions.length - 1
                  ? 'bg-accent text-accent-fg font-semibold text-sm px-7 py-3 rounded-full hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100 transition-[filter,transform]'
                  : 'border border-wm-graphite text-wm-ivory font-medium text-sm px-7 py-3 rounded-full hover:border-wm-stone active:scale-[0.97] motion-reduce:active:scale-100 transition-[border-color,transform]'
              return action.href ? (
                <Link key={action.label} to={action.href} onClick={onClose} className={cls}>
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  className={cls}
                  onClick={() => {
                    onClose()
                    action.onClick?.()
                  }}
                >
                  {action.label}
                </button>
              )
            })}

            {/* Chất lượng hiệu ứng nền WebGL — vô nghĩa khi đã tắt chuyển động */}
            {!reduced && (
              <button
                type="button"
                onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
                className="ml-auto text-sm text-wm-sage hover:text-wm-ivory transition-colors"
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

