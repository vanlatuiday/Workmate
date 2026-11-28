// Thông báo nổi toàn trang: nút chuông tròn kéo được (bám mép trái/phải, nằm trên nút tin nhắn) + popup thông báo.
// Cùng đối tượng/hiệu ứng với Messenger: chỉ người tìm việc / nhà tuyển dụng đã đăng nhập; chỉ dùng transform/opacity.
// Popup là dialog: bẫy focus, Esc đóng, trả focus về nơi đã mở nó; lúc đóng vẫn ở trong DOM nhưng `invisible`.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { CONTENT_CLOSE, CONTENT_OPEN, FOCUSABLE, PANEL_CLOSE, PANEL_OPEN } from '@components/floating/panelMotion'
import { lockScroll } from '@components/floating/scrollLock'
import { useFloatMetrics, useFloatingButton, type FloatPos } from '@components/floating/useFloatingButton'
import { useAuthStore } from '@context/authStore'
import { useMessengerStore } from '@context/messengerStore'
import { useNotificationCenterStore } from '@context/notificationCenterStore'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useUnreadCount, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ICON } from '@utils/ui'
import { MarkAllReadButton } from './NotificationList'
import NotificationBoard from './NotificationBoard'
import '@components/floating/communicationTheme.css'

const STORAGE_KEY = 'workmate-notify-pos'
// Mặc định trùng chỗ nút tin nhắn (góc dưới phải); nút này rank 1 nên tự nhường, nằm ngay trên nút tin nhắn
const DEFAULT_POS: FloatPos = { side: 'right', yRatio: 1 }

export default function NotificationCenter() {
  const role = useAuthStore((s) => s.user?.role)
  if (role !== 'jobseeker' && role !== 'recruiter') return null
  return <CenterInner viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function CenterInner({ viewer }: { viewer: Side }) {
  const { open, openCenter, closeCenter, inShell } = useNotificationCenterStore()
  const messengerOpen = useMessengerStore((s) => s.open)
  const unread = useUnreadCount(viewer)
  const { pathname } = useLocation()
  const reduced = useReducedMotion()
  const { size: SIZE, gap: GAP } = useFloatMetrics()

  const launcherRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)

  const { x, y, dragging, animate, compact, buttonProps } = useFloatingButton({
    storageKey: STORAGE_KEY,
    defaultPos: DEFAULT_POS,
    rank: 1,
    defaultOffsetY: -(SIZE + GAP), // mặc định nằm sẵn trên nút tin nhắn, không phụ thuộc registry
    open,
    onActivate: openCenter,
    launcherRef,
    wrapRef,
    panelRef,
    hidden: inShell,
  })

  // Gỡ component (đăng xuất, đổi vai trò) thì đóng popup để lần đăng nhập sau không tự bật
  useEffect(() => closeCenter, [closeCenter])

  // Đổi trang thì đóng popup
  const prevPath = useRef(pathname)
  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname
    closeCenter()
  }, [pathname, closeCenter])

  // Chỉ một popup mở một lúc: tin nhắn mở thì đóng thông báo
  useEffect(() => {
    if (messengerOpen) closeCenter()
  }, [messengerOpen, closeCenter])

  // ---- Bàn phím: Esc đóng, Tab xoay vòng trong popup ----
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCenter()
        return
      }
      const panel = panelRef.current
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0)
      if (items.length === 0) return
      const firstEl = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === firstEl || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeCenter])

  // Khóa cuộn trang khi mở (bộ khóa dùng chung có bộ đếm, hai khung không giẫm lên nhau)
  useEffect(() => {
    if (!open) return
    return lockScroll()
  }, [open])

  // Mở: nhớ phần tử đã mở popup rồi focus vào nút X; đóng: trả focus về nơi đã mở (mất rồi thì về nút chuông)
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const a = document.activeElement
      openerRef.current = a instanceof HTMLElement && a !== document.body ? a : null
      const id = window.setTimeout(() => closeRef.current?.focus(), 60)
      return () => window.clearTimeout(id)
    }
    if (wasOpen.current) {
      wasOpen.current = false
      const opener = openerRef.current
      openerRef.current = null
      // Đóng do tin nhắn mở thì không giành focus của khung tin nhắn
      if (useMessengerStore.getState().open) return
      if (opener && opener.isConnected && opener !== launcherRef.current) opener.focus()
      else launcherRef.current?.focus()
    }
  }, [open])

  return (
    <>
      {/* Nút chuông tròn kéo được — ẩn trong dashboard vì header đã có chuông */}
      <div
        hidden={inShell}
        className={cn(
          'communication-theme fixed left-0 top-0 z-[60] !bg-transparent',
          // Thả tay thì trượt về mép; đang kéo thì bám theo con trỏ ngay
          animate && !dragging && 'transition-transform duration-base ease-editorial motion-reduce:transition-none',
        )}
        style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      >
        {/* data-floating: ẩn trong lúc intro trang chủ (index.css) */}
        <div
          data-floating
          className={cn(
            'relative transition-opacity duration-base motion-reduce:transition-none',
            open && 'pointer-events-none opacity-0',
          )}
        >
          <button
            ref={launcherRef}
            type="button"
            {...buttonProps}
            tabIndex={open ? -1 : 0}
            aria-hidden={open || undefined}
            aria-haspopup="dialog"
            aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
            style={{ touchAction: compact ? 'auto' : 'none', width: SIZE, height: SIZE }}
            className={cn(
              'flex items-center justify-center rounded-full bg-page-fg text-page-bg ring-1 ring-wm-day/40 hover:ring-2 hover:ring-wm-day/70 md:cursor-grab md:active:cursor-grabbing',
              'transition-transform duration-fast hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100',
              FOCUS,
            )}
          >
            <Bell aria-hidden="true" className="h-6 w-6" />
          </button>
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-page-fg bg-page-bg px-1 text-xs font-medium text-danger"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>

      {/* Lớp mờ nền */}
      <div
        aria-hidden="true"
        onClick={closeCenter}
        className={cn(
          'fixed inset-0 z-[85] bg-wm-abyss/20 backdrop-blur-md transition-opacity duration-slow ease-editorial will-change-[opacity] motion-reduce:transition-none',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Desktop rộng để đọc nội dung; điện thoại dùng trọn màn hình. */}
      <div ref={wrapRef} className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Thông báo"
          aria-hidden={!open}
          tabIndex={-1}
          data-lenis-prevent
          style={{ transition: reduced ? 'none' : open ? PANEL_OPEN : PANEL_CLOSE }}
          className={cn(
            'communication-theme flex h-full w-full flex-col overflow-hidden bg-page-bg text-page-fg outline-none will-change-transform',
            'sm:h-[min(780px,88dvh)] sm:w-[min(640px,calc(100vw-3rem))] sm:rounded-lg sm:border sm:border-page-line lg:w-[min(1040px,calc(100vw-4rem))]',
            open ? 'pointer-events-auto visible scale-100 opacity-100' : 'invisible scale-[0.15] opacity-0',
          )}
        >
          <div
            className={cn('flex min-h-0 flex-1 flex-col', open ? 'opacity-100' : 'opacity-0')}
            style={{ transition: reduced ? 'none' : open ? CONTENT_OPEN : CONTENT_CLOSE }}
          >
            <div className="notification-titlebar grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center"><Bell className="h-5 w-5" /></span>
              <h2 className="text-center font-display text-xl font-semibold text-page-fg">Thông báo</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closeCenter}
                aria-label="Đóng thông báo"
                className={cn(BTN_ICON, 'h-11 w-11 bg-wm-day/10 hover:bg-wm-day/20')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-page-line px-4 py-3 sm:px-5">
              <p className="text-sm text-page-muted">{unread > 0 ? <><strong className="font-semibold text-danger">{unread}</strong> thông báo chưa đọc</> : 'Cập nhật hoạt động của bạn'}</p>
              <MarkAllReadButton viewer={viewer} compact className="min-h-11" />
            </div>
            {open && <NotificationBoard viewer={viewer} open={open} onNavigate={closeCenter} />}
          </div>
        </div>
      </div>
    </>
  )
}
