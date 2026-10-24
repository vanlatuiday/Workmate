// Khung modal dùng chung cho chi tiết (tầng 3) và form sửa.
// Đóng bằng nền / nút X / Esc; giữ focus trong khung; trả focus về ô đã mở; khóa cuộn nền.
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { useView } from './context'
import { FOCUS } from './ui'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function Modal({
  title,
  cellId,
  onClose,
  children,
}: {
  title: string
  /** Ô bento đã mở modal, dùng để trả focus nếu nút mở không còn */
  cellId: string
  onClose: () => void
  children: React.ReactNode
}) {
  const { themeClass } = useView()
  const reduced = useReducedMotion()
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  // Phần tử đang giữ focus lúc mở (nút bút chì, ô, gợi ý…)
  const [opener] = useState(() => document.activeElement as HTMLElement | null)

  // Khóa cuộn nền (trang này không dùng Lenis) + focus vào nút đóng + trả focus khi đóng
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    closeBtn.current?.focus()
    return () => {
      html.style.overflow = prev
      const target = opener?.isConnected ? opener : document.querySelector<HTMLElement>(`[data-cell-open="${cellId}"]`)
      target?.focus()
    }
  }, [opener, cellId])

  // Esc đóng; Tab xoay vòng trong modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const dur = reduced ? 0 : 0.25
  return createPortal(
    <div className={cn(themeClass, '!bg-transparent')}>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--wm-charcoal)_60%,transparent)] sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: dur }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex h-[100dvh] w-full flex-col overflow-hidden border border-page-line bg-page-bg text-page-fg sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-card"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-page-line px-5 py-4 sm:px-6">
            <h2 id={titleId} className="font-display text-xl font-semibold">
              {title}
            </h2>
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className={cn('grid h-9 w-9 place-items-center rounded-full border border-page-line text-page-muted hover:text-page-fg', FOCUS)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  )
}
