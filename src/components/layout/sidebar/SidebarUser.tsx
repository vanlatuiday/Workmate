import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Home, LogOut, MoreHorizontal, Settings, User } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { SidebarConfig } from './config'

const FADE = 'transition-[opacity,visibility] duration-200 motion-reduce:transition-none'
const MENU_ITEM = cn(
  'flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm font-medium text-page-muted transition-colors duration-fast hover:bg-white/70 hover:text-page-fg',
  FOCUS,
)

type Props = {
  config: SidebarConfig
  collapsed: boolean
  onNavigate?: () => void
  tip: (label: string) => Record<string, unknown>
}

/** Khối người dùng cuối thanh bên: avatar + chấm online, tên, email, nút ⋯ mở menu tài khoản. */
export default function SidebarUser({ config, collapsed, onNavigate, tip }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const email = user?.email ?? ''
  const name = user?.displayName || user?.username || email.split('@')[0] || 'Tài khoản'
  const initial = (email[0] ?? 'U').toUpperCase()
  const open = pos !== null

  const close = (refocus = true) => {
    setPos(null)
    if (refocus) triggerRef.current?.focus()
  }

  const toggle = (trigger: HTMLElement) => {
    if (open) return close(false)
    triggerRef.current = trigger
    const r = trigger.getBoundingClientRect()
    // Thu gọn: menu mở sang phải avatar; mở rộng: mở lên phía trên khối người dùng
    setPos(
      collapsed
        ? { left: r.right + 12, bottom: window.innerHeight - r.bottom }
        : { left: Math.max(12, r.right - 244), bottom: window.innerHeight - r.top + 12 },
    )
  }

  // Mở menu → focus mục đầu; bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus())
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !avatarRef.current?.contains(t) && !moreRef.current?.contains(t)) setPos(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // Thu gọn/mở rộng khi menu đang mở → đóng cho khỏi lệch vị trí
  useEffect(() => setPos(null), [collapsed])

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const i = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      return close()
    }
    if (e.key === 'Tab') return close(false)
    let next = -1
    if (e.key === 'ArrowDown') next = (i + 1) % list.length
    else if (e.key === 'ArrowUp') next = (i - 1 + list.length) % list.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = list.length - 1
    if (next < 0) return
    e.preventDefault()
    list[next]?.focus()
  }

  const go = () => {
    close(false)
    onNavigate?.()
  }

  return (
    <div className="flex-shrink-0 border-t border-page-line p-3">
      <div className="relative flex h-12 items-center">
        {/* Avatar: nút mở menu khi thu gọn (chỉ còn avatar) */}
        <button
          ref={avatarRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Tài khoản ${name}`}
          onClick={(e) => toggle(e.currentTarget)}
          {...(collapsed ? tip('Tài khoản') : {})}
          className={cn('relative ml-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-page-fg text-sm font-medium text-page-bg', FOCUS)}
        >
          {initial}
          <span aria-hidden="true" className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-wm-ivory bg-wm-fern" />
        </button>
        <div className={cn('ml-3 min-w-0 flex-1 pr-10', FADE, collapsed ? 'invisible opacity-0' : 'visible opacity-100 delay-150')}>
          <p className="truncate text-sm font-semibold text-page-fg">{name}</p>
          <p className="truncate text-xs text-page-muted">{email}</p>
        </div>
        <button
          ref={moreRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Mở menu tài khoản"
          tabIndex={collapsed ? -1 : 0}
          onClick={(e) => toggle(e.currentTarget)}
          className={cn(
            'absolute right-4 flex h-9 w-9 items-center justify-center rounded-full text-page-muted hover:bg-white/70 hover:text-page-fg',
            'transition-[opacity,visibility,background-color,color]', 'duration-200 motion-reduce:transition-none',
            collapsed ? 'invisible opacity-0' : 'visible opacity-100 delay-150',
            FOCUS,
          )}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Tài khoản"
            onKeyDown={onMenuKey}
            style={{ left: pos.left, bottom: pos.bottom }}
            className="sb-tip theme-ivory fixed z-[80] w-[232px] rounded-[18px] p-2"
          >
            {config.profileHref && (
              <Link role="menuitem" to={config.profileHref} className={MENU_ITEM} onClick={go}>
                <User className="h-[18px] w-[18px]" aria-hidden="true" /> Hồ sơ
              </Link>
            )}
            <Link role="menuitem" to={config.settingsHref} className={MENU_ITEM} onClick={go}>
              <Settings className="h-[18px] w-[18px]" aria-hidden="true" /> Cài đặt
            </Link>
            <Link role="menuitem" to="/" className={MENU_ITEM} onClick={go}>
              <Home className="h-[18px] w-[18px]" aria-hidden="true" /> Về trang chủ
            </Link>
            <div role="separator" className="my-1 h-px bg-page-line" />
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => {
                go()
                logout()
                navigate('/dang-nhap')
              }}
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Đăng xuất
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
