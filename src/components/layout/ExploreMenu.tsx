import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import RollText from '@components/motion/RollText'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { MenuItem } from '@components/layout/MenuOverlay'

/** Các trang thông tin chung — gom vào mục "Khám phá" để menu chính trên header vẫn gọn */
export const EXPLORE_ITEMS: MenuItem[] = [
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Công ty', href: '/cong-ty' },
  { label: 'Cẩm nang', href: '/cam-nang' },
  { label: 'Hỗ trợ', href: '/ho-tro' },
  { label: 'Liên hệ', href: '/lien-he' },
]

const ITEM = cn(
  'block w-full rounded-control px-3 py-2 text-left text-sm text-page-muted transition-colors duration-300 hover:bg-page-surface hover:text-page-fg',
  FOCUS,
)

/**
 * Mục "Khám phá ▾" trong menu chính của header: bấm mở menu nhỏ các trang thông tin.
 * Theo mẫu menu button của WAI-ARIA (như AccountMenu): mũi tên lên/xuống chuyển mục, Esc đóng.
 */
export default function ExploreMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const { pathname } = useLocation()
  const current = EXPLORE_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]

  // Đổi trang thì đóng
  useEffect(() => setOpen(false), [pathname])

  // Bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    setOpen(true)
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
      setOpen(false)
      buttonRef.current?.focus()
      return
    } else if (e.key === 'Tab') {
      setOpen(false)
      return
    }
    if (next < 0) return
    e.preventDefault()
    list[next]?.focus()
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        className={cn(
          'group flex items-center gap-1 rounded-control px-3 py-2 text-sm font-medium transition-colors',
          current || open ? 'text-page-fg' : 'text-page-muted hover:text-page-fg',
          FOCUS,
        )}
      >
        <RollText>Khám phá</RollText>
        <ChevronDown
          aria-hidden="true"
          className={cn('h-4 w-4 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')}
        />
      </button>

      {/* Luôn trong DOM để mờ/trượt mượt; lúc đóng thì ẩn khỏi bàn phím và trình đọc màn hình */}
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Khám phá"
        onKeyDown={onMenuKey}
        className={cn(
          'absolute left-1/2 top-full mt-2 w-52 -translate-x-1/2 rounded-card border border-page-line bg-page-bg p-2',
          'transition-[opacity,transform,visibility] duration-300 ease-editorial motion-reduce:transition-none',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        {EXPLORE_ITEMS.map((item) => (
          <Link
            key={item.href}
            role="menuitem"
            to={item.href}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={ITEM}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
