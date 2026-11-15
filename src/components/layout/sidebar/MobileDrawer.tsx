import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { cn } from '@utils/cn'

type Props = {
  open: boolean
  onClose: () => void
  /** Nút mở menu — nhận lại focus khi đóng */
  returnFocusRef: RefObject<HTMLElement>
  children: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Ngăn kéo mobile (<768px): trượt từ trái, nền tối phía sau (bấm ra ngoài hoặc Esc để đóng),
 * khóa Tab trong ngăn kéo, đóng xong trả focus về nút menu. Luôn nằm trong DOM để trượt mượt;
 * lúc đóng thì `invisible` nên không vào được bằng bàn phím/trình đọc màn hình.
 */
export default function MobileDrawer({ open, onClose, returnFocusRef, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      // Chờ ngăn kéo hết invisible rồi mới focus
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('button[aria-label="Đóng menu"]')?.focus())
    } else if (wasOpen.current) {
      wasOpen.current = false
      returnFocusRef.current?.focus()
    }
  }, [open, returnFocusRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Khóa Tab: vòng quanh các phần tử bấm được bên trong ngăn kéo (bỏ qua sự kiện từ portal tooltip/menu)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current?.contains(e.target as Node)) return
    const list = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={cn('fixed inset-0 z-[70] md:hidden', !open && 'pointer-events-none')} aria-hidden={!open} onKeyDown={onKeyDown}>
      <div
        onClick={onClose}
        className={cn('absolute inset-0 bg-wm-charcoal/55 transition-opacity duration-base motion-reduce:transition-none', open ? 'opacity-100' : 'opacity-0')}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        className={cn(
          'absolute bottom-4 left-4 top-4 transition-[transform,visibility] duration-base ease-editorial motion-reduce:transition-none',
          open ? 'visible translate-x-0' : 'invisible -translate-x-[120%]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
