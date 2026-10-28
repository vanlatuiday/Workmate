import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Props = {
  /** Chữ trong vòng tròn, vd. chữ cái đầu email */
  initial: string
  /** Nút vào khu làm việc của vai trò, vd. "Khu tìm việc" */
  area: { label: string; href: string }
  profileHref: string
  /** Mở trang cá nhân (màn phủ từ trên xuống) — nhận sự kiện bấm của link */
  onOpenProfile: (e: MouseEvent<HTMLAnchorElement>) => void
  onLogout: () => void
  /** Trang chủ: nút có hiệu ứng nam châm */
  magnetic: boolean
}

const ITEM = cn(
  'block w-full rounded-control px-3 py-2 text-left text-sm text-page-muted transition-colors duration-300 hover:bg-page-surface hover:text-page-fg',
  FOCUS,
)

/**
 * Nút tài khoản ở header (đã đăng nhập): vòng chữ tắt + "Trang cá nhân ▾",
 * bấm mở menu nhỏ gồm khu làm việc, trang cá nhân, đăng xuất.
 * Theo mẫu menu button của WAI-ARIA: mũi tên lên/xuống chuyển mục, Esc đóng và trả focus về nút.
 */
export default function AccountMenu({ initial, area, profileHref, onOpenProfile, onLogout, magnetic }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const location = useLocation()

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]

  // Đổi trang thì đóng
  useEffect(() => setOpen(false), [location.pathname])

  // Bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    setOpen(true)
    // Chờ menu hiện rồi focus mục đầu/cuối
    requestAnimationFrame(() => {
      const list = items()
      ;(e.key === 'ArrowDown' ? list[0] : list[list.length - 1])?.focus()
    })
  }

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    let next = -1
    if (e.key === 'ArrowDown') next = (i + 1) % list.length
    else if (e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = list.length - 1
    else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    } else if (e.key === 'Tab') {
      close(false)
      return
    }
    if (next < 0) return
    e.preventDefault()
    list[next]?.focus()
  }

  return (
    <div ref={wrapRef} className="relative">
      <Magnetic strength={magnetic ? 0.3 : 0}>
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onButtonKey}
          className={cn(
            'group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-page-muted transition-colors duration-300 hover:text-page-fg',
            FOCUS,
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-page-edge text-xs font-medium text-page-fg"
          >
            {initial}
          </span>
          <RollText>Trang cá nhân</RollText>
          <ChevronDown
            aria-hidden="true"
            className={cn('h-4 w-4 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')}
          />
        </button>
      </Magnetic>

      {/* Luôn trong DOM để mờ/trượt mượt; lúc đóng thì ẩn khỏi bàn phím và trình đọc màn hình */}
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Tài khoản"
        onKeyDown={onMenuKey}
        className={cn(
          'absolute right-0 top-full mt-2 w-56 rounded-card border border-page-line bg-page-bg p-2',
          'transition-[opacity,transform,visibility] duration-300 ease-editorial motion-reduce:transition-none',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <Link role="menuitem" to={area.href} className={ITEM} onClick={() => close(false)}>
          {area.label}
        </Link>
        <Link
          role="menuitem"
          to={profileHref}
          className={ITEM}
          onClick={(e) => {
            close(false)
            onOpenProfile(e)
          }}
        >
          Trang cá nhân
        </Link>
        <div role="separator" className="my-1 h-px bg-page-line" />
        <button
          role="menuitem"
          type="button"
          className={ITEM}
          onClick={() => {
            close(false)
            onLogout()
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
