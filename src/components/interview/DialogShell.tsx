import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Props = { titleId: string; title: string; subtitle?: string; onClose: () => void; children: ReactNode }

/**
 * Khung hộp thoại dùng chung cho mời / chọn giờ phỏng vấn: portal, nền phủ, Esc/X/nền đóng,
 * giữ focus trong khung, khóa cuộn nền và trả focus về nút đã mở. Mount = mở, unmount = đóng.
 */
export default function DialogShell({ titleId, title, subtitle, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const originRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`

    const onKey = (e: KeyboardEvent) => {
      // Chặn không cho khung bên dưới (vd. chi tiết Kết nối) cũng nhận Esc/Tab
      if (e.key === 'Escape' || e.key === 'Tab') e.stopPropagation()
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    const back = originRef.current
    return () => {
      document.removeEventListener('keydown', onKey, true)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-8">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-wm-charcoal/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative flex max-h-[90svh] w-full flex-col rounded-t-card border border-page-line bg-wm-ivory text-wm-charcoal md:max-w-lg md:rounded-card"
      >
        <header className="flex items-start justify-between gap-4 border-b border-page-line px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-semibold text-page-fg">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-page-muted">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className={cn('shrink-0 rounded-control p-1.5 text-page-muted transition-colors duration-300 hover:text-page-fg', FOCUS)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
