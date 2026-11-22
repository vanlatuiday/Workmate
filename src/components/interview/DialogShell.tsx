import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { lockScroll } from '@components/floating/scrollLock'

type Props = { titleId: string; title: string; subtitle?: string; onClose: () => void; children: ReactNode; className?: string; contentKey?: string }

/**
 * Khung hộp thoại dùng chung cho mời / chọn giờ phỏng vấn: portal, nền phủ, Esc/X/nền đóng,
 * giữ focus trong khung, khóa cuộn nền và trả focus về nút đã mở. Mount = mở, unmount = đóng.
 */
export default function DialogShell({ titleId, title, subtitle, onClose, children, className, contentKey }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const originRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
    closeRef.current?.focus({ preventScroll: true })
  }, [contentKey])

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    const prevPadding = html.style.paddingRight
    const unlockScroll = lockScroll()
    if (gap > 0) html.style.paddingRight = `${gap}px`

    const onKey = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[data-dialog-shell]')
      if (dialogs[dialogs.length - 1] !== panelRef.current) return
      // Chặn không cho khung bên dưới (vd. chi tiết Kết nối) cũng nhận Esc/Tab
      if (e.key === 'Escape' || e.key === 'Tab') e.stopPropagation()
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((item) => item.tabIndex >= 0 && !item.closest('[hidden], [aria-hidden="true"], [inert]') && item.getClientRects().length > 0)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      const outside = !panelRef.current?.contains(active)
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    const back = originRef.current
    return () => {
      document.removeEventListener('keydown', onKey, true)
      unlockScroll()
      html.style.paddingRight = prevPadding
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-8">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-wm-charcoal/40" />
      <div
        ref={panelRef}
        data-dialog-shell
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('theme-ivory relative flex max-h-[90svh] w-full flex-col rounded-t-card border border-page-line bg-wm-ivory text-wm-charcoal md:max-w-lg md:rounded-card', className)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-page-line px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words font-display text-xl font-semibold text-page-fg">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-page-muted">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className={cn('inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control p-1.5 text-page-muted transition-colors duration-fast hover:text-page-fg', FOCUS)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
