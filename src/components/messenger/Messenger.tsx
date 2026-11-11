// Tin nhắn nổi toàn trang: nút tròn kéo được (bám mép trái/phải) + khung chat nhỏ mở giữa màn hình.
// Chỉ hiện cho người tìm việc / nhà tuyển dụng đã đăng nhập. Chỉ dùng transform/opacity để chuyển động.
// Khung là dialog: bẫy focus, Esc đóng, trả focus về nút; lúc đóng vẫn ở trong DOM nhưng `invisible`.
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageCircle, MessageSquare, X } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMessengerStore } from '@context/messengerStore'
import { useConversations, useUnreadMessages, type Side } from '@services/connectionService'
import ChatPane from '@pages/public/messages/ChatPane'
import ConversationList from '@pages/public/messages/ConversationList'
import { CONTENT_CLOSE, CONTENT_OPEN, FOCUSABLE, PANEL_CLOSE, PANEL_OPEN } from '@components/floating/panelMotion'
import { lockScroll } from '@components/floating/scrollLock'
import { FLOAT_SIZE as SIZE, useFloatingButton, type FloatPos } from '@components/floating/useFloatingButton'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const STORAGE_KEY = 'workmate-messenger-pos'
const DEFAULT_POS: FloatPos = { side: 'right', yRatio: 1 }

export default function Messenger() {
  const role = useAuthStore((s) => s.user?.role)
  if (role !== 'jobseeker' && role !== 'recruiter') return null
  return <MessengerInner viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function MessengerInner({ viewer }: { viewer: Side }) {
  const { open, activeKey, openMessenger, closeMessenger, setActiveKey } = useMessengerStore()
  const unread = useUnreadMessages()
  const conversations = useConversations()
  const { pathname, search, hash, state } = useLocation()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  // Từ md: hai cột (danh sách | chat), tự mở hội thoại đầu khi chưa chọn
  const wide = useMediaQuery('(min-width: 768px)')

  const launcherRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  const { x, y, dragging, animate, buttonProps } = useFloatingButton({
    storageKey: STORAGE_KEY,
    defaultPos: DEFAULT_POS,
    rank: 0,
    open,
    onActivate: openMessenger,
    launcherRef,
    wrapRef,
    panelRef,
  })

  // Gỡ component (đăng xuất, đổi vai trò) thì đóng khung và bỏ hội thoại đang xem
  useEffect(
    () => () => {
      closeMessenger()
      setActiveKey(null)
    },
    [closeMessenger, setActiveKey],
  )

  // Đổi trang thì đóng khung (trừ khi vừa được MessagesPage chuyển hướng để mở khung)
  // So với đường dẫn trước (không dùng cờ "lần đầu" vì StrictMode chạy effect hai lần)
  const prevPath = useRef(pathname)
  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname
    if ((state as { keepMessenger?: boolean } | null)?.keepMessenger) return
    closeMessenger()
  }, [pathname, state, closeMessenger])

  // /tin-nhan chuyển về đây kèm state.openChat (null = danh sách, "jobId|seekerId" = hội thoại).
  // Mở ở chính khung tin nhắn (đã dựng xong) thay vì ở MessagesPage: tải thẳng /tin-nhan thì effect dọn dẹp
  // lúc dựng component (StrictMode) chạy sau MessagesPage và đóng khung vừa mở.
  // Xong thì xóa state để F5 / quay lại trang không mở lại khung.
  const openChat = (state as { openChat?: string | null } | null)?.openChat
  useEffect(() => {
    if (openChat === undefined) return
    openMessenger(openChat)
    navigate({ pathname, search, hash }, { replace: true, state: { keepMessenger: true } })
  }, [openChat, openMessenger, navigate, pathname, search, hash])

  // ---- Bàn phím: Esc đóng, Tab xoay vòng trong khung ----
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMessenger()
        return
      }
      const panel = panelRef.current
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled'))
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
  }, [open, closeMessenger])

  // Khóa cuộn trang khi mở (bộ khóa dùng chung có bộ đếm, hai khung không giẫm lên nhau)
  useEffect(() => {
    if (!open) return
    return lockScroll()
  }, [open])

  // Mở: focus vào nút X (chờ một nhịp vì khung đang chuyển từ invisible); đóng: trả focus về nút tròn
  useEffect(() => {
    if (open) {
      wasOpen.current = true
      const id = window.setTimeout(() => closeRef.current?.focus(), 60)
      return () => window.clearTimeout(id)
    }
    if (wasOpen.current) {
      wasOpen.current = false
      launcherRef.current?.focus()
    }
  }, [open])

  // Đổi giữa danh sách và khung chat: nút vừa bấm biến mất → đưa focus vào khung để không rơi ra ngoài
  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true })
  }, [activeKey, open])

  // Khóa trỏ tới hội thoại không tồn tại → quay về danh sách (chỉ khi danh sách đã có dữ liệu)
  const active = conversations.find((c) => c.key === activeKey) ?? null
  const shown = active ?? (wide ? (conversations[0] ?? null) : null)
  useEffect(() => {
    if (activeKey && !active && conversations.length > 0) setActiveKey(null)
  }, [activeKey, active, conversations.length, setActiveKey])

  return (
    <>
      {/* Nút tròn kéo được */}
      <div
        className={cn(
          'theme-ivory fixed left-0 top-0 z-[60] !bg-transparent', // theme-ivory tự tô nền ngà → bỏ để chỉ còn nút tròn
          // Thả tay thì trượt về mép; đang kéo thì bám theo con trỏ ngay
          animate && !dragging && 'transition-transform duration-300 ease-editorial motion-reduce:transition-none',
        )}
        style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      >
        {/* data-floating: ẩn trong lúc intro trang chủ (index.css) — mọi nút/icon nổi đều gắn nhãn này */}
        <div
          data-floating
          className={cn(
            'relative transition-opacity duration-300 motion-reduce:transition-none',
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
            aria-label={unread > 0 ? `Mở tin nhắn (${unread} tin mới)` : 'Mở tin nhắn'}
            style={{ touchAction: 'none', width: SIZE, height: SIZE }}
            className={cn(
              // Viền ngà mờ: tách nút khỏi nền tối (trang chủ, dashboard kính); trên nền ngà thì gần như không thấy
              'flex cursor-grab items-center justify-center rounded-full bg-page-fg text-page-bg ring-1 ring-wm-ivory/40 active:cursor-grabbing',
              'transition-transform duration-200 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100',
              FOCUS,
            )}
          >
            <MessageCircle aria-hidden="true" className="h-6 w-6" />
          </button>
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-page-fg bg-page-bg px-1 text-xs font-medium text-page-fg"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>

      {/* Lớp mờ nền */}
      <div
        aria-hidden="true"
        onClick={closeMessenger}
        className={cn(
          // Lớp mờ toàn màn hình nặng → will-change để trình duyệt chuẩn bị lớp riêng, mờ/rõ không rớt khung
          'fixed inset-0 z-[85] bg-wm-charcoal/20 backdrop-blur-md transition-opacity duration-500 ease-out will-change-[opacity] motion-reduce:transition-none',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Khung chat: giữa màn hình (mobile gần kín màn hình) */}
      <div ref={wrapRef} className="pointer-events-none fixed inset-3 z-[85] flex items-center justify-center sm:inset-0">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Tin nhắn"
          aria-hidden={!open}
          tabIndex={-1}
          data-lenis-prevent
          style={{ transition: reduced ? 'none' : open ? PANEL_OPEN : PANEL_CLOSE }}
          className={cn(
            'theme-ivory flex h-full w-full flex-col overflow-hidden rounded-card border border-page-line bg-page-bg text-page-fg outline-none will-change-transform',
            'sm:h-[min(640px,calc(100svh-2rem))] sm:w-[min(880px,calc(100vw-2rem))] md:w-[min(880px,calc(100vw-4rem))]',
            open ? 'pointer-events-auto visible scale-100 opacity-100' : 'invisible scale-[0.15] opacity-0',
          )}
        >
          <div
            className={cn('flex min-h-0 flex-1 flex-col', open ? 'opacity-100' : 'opacity-0')}
            style={{ transition: reduced ? 'none' : open ? CONTENT_OPEN : CONTENT_CLOSE }}
          >
          <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-4 md:px-6 md:pt-5">
            <h2 className="font-display text-xl font-semibold text-page-fg">Tin nhắn</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMessenger}
              aria-label="Đóng tin nhắn"
              className={cn('rounded-full border border-page-line p-3 text-page-fg transition-colors duration-300 hover:border-page-fg', FOCUS)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {/* Hẹp: một cột (danh sách → chat → quay lại). Từ md: hai cột như trang tin nhắn cũ. */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-4 pb-4 pt-2 md:grid-cols-[300px_minmax(0,1fr)] md:px-6 md:pb-6">
            <div className={cn('min-h-0', active ? 'hidden md:block' : 'block')}>
              <ConversationList viewer={viewer} conversations={conversations} activeKey={shown?.key ?? null} onSelect={(c) => setActiveKey(c.key)} />
            </div>
            <div className={cn('min-h-0', active ? 'block' : 'hidden md:block')}>
              {shown ? (
                <ChatPane
                  key={shown.key}
                  viewer={viewer}
                  jobId={shown.jobId}
                  seekerId={shown.seekerId}
                  onBack={() => setActiveKey(null)}
                  paused={!open}
                  hideBackOnWide
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-page-muted">
                  <MessageSquare aria-hidden="true" className="h-6 w-6" />
                  <p className="mt-3 text-sm">Chọn một cuộc trò chuyện để bắt đầu.</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}
