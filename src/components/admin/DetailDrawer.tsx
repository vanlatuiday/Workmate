import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Props = { titleId: string; title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Khung chi tiết trượt từ bên phải cho các bảng của khu quản trị: portal, nền phủ, Esc/X/nền đóng,
 * giữ focus trong khung, khóa cuộn nền, trả focus về dòng đã mở. Mount = mở, unmount = đóng.
 * Khi một hộp thoại khác (xác nhận, nhập lý do) đang mở phía trên thì khung này không nhận Esc/Tab.
 */
export default function DetailDrawer({ titleId, title, subtitle, onClose, children, footer }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const originRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Trượt vào: bắt đầu ngoài màn hình rồi về 0 sau khung hình đầu (chỉ transform; tắt khi giảm chuyển động)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Tab') return
      // Có hộp thoại khác nằm trên khung này → nhường cho nó
      const other = Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).some((d) => d !== panelRef.current)
      if (other) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      const items = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
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
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey, true)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[60] flex justify-end">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-wm-charcoal/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'theme-ivory relative flex h-full w-full max-w-xl flex-col border-l border-page-line bg-wm-ivory text-wm-charcoal',
          'transition-transform duration-300 ease-out motion-reduce:transition-none',
          shown ? 'translate-x-0' : 'translate-x-full motion-reduce:translate-x-0',
        )}
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
        {footer && <footer className="flex flex-wrap items-center gap-2 border-t border-page-line px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
