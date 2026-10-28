// Khung tiêu chí trượt từ bên phải của trang /match (người tìm việc).
// Mẫu theo drawer của DashboardShell: luôn nằm trong DOM, lúc đóng thì ẩn khỏi bàn phím/trình đọc màn hình.
// Lớp phủ nhẹ để người dùng còn thấy lưới thay đổi phía sau khi chỉnh tiêu chí.
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function CriteriaDrawer({
  id,
  open,
  onClose,
  triggerRef,
  children,
}: {
  id: string
  open: boolean
  onClose: () => void
  /** Nút mở khung — nhận lại focus khi đóng */
  triggerRef: RefObject<HTMLElement>
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Esc đóng; Tab xoay vòng trong khung
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled'))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !sheetRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !sheetRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Khóa cuộn trang khi mở
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev
    }
  }, [open])

  // Mở thì focus vào nút X; đóng thì trả focus về nút "Tiêu chí"
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      closeRef.current?.focus()
    } else if (wasOpen.current) {
      wasOpen.current = false
      triggerRef.current?.focus()
    }
  }, [open, triggerRef])

  return (
    <div className={cn('fixed inset-0 z-[60]', !open && 'pointer-events-none')} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-wm-charcoal transition-opacity duration-300 motion-reduce:transition-none',
          open ? 'opacity-40' : 'opacity-0',
        )}
      />
      <div
        ref={sheetRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        data-lenis-prevent
        className={cn(
          'theme-ivory absolute inset-y-0 right-0 h-full w-full max-w-md overflow-y-auto border-l border-page-line bg-page-bg text-page-fg',
          'transition-[transform,visibility] duration-300 ease-editorial motion-reduce:transition-none',
          open ? 'visible translate-x-0' : 'invisible translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-4 px-6 pb-2 pt-6">
          <h2 id={`${id}-title`} className="font-display text-xl font-medium text-page-fg">
            Tiêu chí của bạn
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng tiêu chí"
            className={`rounded-full border border-page-line p-2 text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 pb-8 pt-4">{children}</div>
      </div>
    </div>
  )
}
