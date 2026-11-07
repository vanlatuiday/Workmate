// Tin nhắn nổi toàn trang: nút tròn kéo được (bám mép trái/phải) + khung chat nhỏ mở giữa màn hình.
// Chỉ hiện cho người tìm việc / nhà tuyển dụng đã đăng nhập. Chỉ dùng transform/opacity để chuyển động.
// Khung là dialog: bẫy focus, Esc đóng, trả focus về nút; lúc đóng vẫn ở trong DOM nhưng `invisible`.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircle, MessageSquare, X } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { getSmoothScroll } from '@hooks/useSmoothScroll'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMessengerStore } from '@context/messengerStore'
import { useConversations, useUnreadMessages, type Side } from '@services/connectionService'
import ChatPane from '@pages/public/messages/ChatPane'
import ConversationList from '@pages/public/messages/ConversationList'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
const STORAGE_KEY = 'workmate-messenger-pos'
const SIZE = 56 // đường kính nút
const EDGE = 12 // khoảng cách tới mép trái/phải
const TOP = 72 // dưới header 4rem + chút đệm
const BOTTOM = 76 // đệm đáy: chừa chỗ cho viên tìm kiếm thu gọn ở đáy màn hình điện thoại + thanh vuốt iPhone
const DRAG_THRESHOLD = 5 // px: di chuyển ít hơn thế vẫn coi là bấm

// Bung ra: phóng nhanh rồi chậm dần, nảy nhẹ ở cuối (đàn hồi); thu về nhanh và gọn hơn
const PANEL_OPEN = 'transform 560ms cubic-bezier(0.32, 1.32, 0.6, 1), opacity 220ms ease-out, visibility 0s'
const PANEL_CLOSE = 'transform 260ms cubic-bezier(0.4, 0, 1, 1), opacity 200ms ease-in 60ms, visibility 0s linear 260ms'
// Nội dung trong khung hiện sau khi khung đã gần bung xong
const CONTENT_OPEN = 'opacity 260ms ease-out 180ms'
const CONTENT_CLOSE = 'opacity 120ms ease-in'

type Pos = { side: 'left' | 'right'; yRatio: number }
const DEFAULT_POS: Pos = { side: 'right', yRatio: 1 }

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_POS
    const p = JSON.parse(raw) as Partial<Pos>
    if ((p.side === 'left' || p.side === 'right') && typeof p.yRatio === 'number' && Number.isFinite(p.yRatio)) {
      return { side: p.side, yRatio: Math.min(1, Math.max(0, p.yRatio)) }
    }
  } catch {
    /* localStorage bị chặn / JSON hỏng → dùng mặc định */
  }
  return DEFAULT_POS
}

function savePos(p: Pos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* bỏ qua */
  }
}

const viewport = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight })
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export default function Messenger() {
  const role = useAuthStore((s) => s.user?.role)
  if (role !== 'jobseeker' && role !== 'recruiter') return null
  return <MessengerInner viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function MessengerInner({ viewer }: { viewer: Side }) {
  const { open, activeKey, openMessenger, closeMessenger, setActiveKey } = useMessengerStore()
  const unread = useUnreadMessages(viewer)
  const conversations = useConversations(viewer)
  const { pathname, state } = useLocation()
  const reduced = useReducedMotion()
  // Từ md: hai cột (danh sách | chat), tự mở hội thoại đầu khi chưa chọn
  const wide = useMediaQuery('(min-width: 768px)')

  const [pos, setPos] = useState<Pos>(loadPos)
  const [vp, setVp] = useState(viewport)
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const dragXYRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  const launcherRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  // Toạ độ nút: x theo mép, y theo tỉ lệ trong vùng cho phép → đổi cỡ cửa sổ là tự kẹp lại
  const minY = TOP
  const maxY = Math.max(minY, vp.h - SIZE - BOTTOM)
  const restX = pos.side === 'left' ? EDGE : vp.w - SIZE - EDGE
  const restY = minY + pos.yRatio * (maxY - minY)
  const x = dragXY?.x ?? restX
  const y = dragXY?.y ?? restY

  useEffect(() => {
    const onResize = () => setVp(viewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Đổi trang thì đóng khung (trừ khi vừa được MessagesPage chuyển hướng để mở khung)
  // So với đường dẫn trước (không dùng cờ "lần đầu" vì StrictMode chạy effect hai lần)
  const prevPath = useRef(pathname)
  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname
    if ((state as { keepMessenger?: boolean } | null)?.keepMessenger) return
    closeMessenger()
  }, [pathname, state, closeMessenger])

  // ---- Kéo nút ----
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: restX, oy: restY, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    d.moved = true
    const next = { x: clamp(d.ox + dx, 0, vp.w - SIZE), y: clamp(d.oy + dy, minY, maxY) }
    dragXYRef.current = next
    setDragXY(next)
  }
  const endDrag = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d?.moved || !dragXYRef.current) return
    // Thả tay: bám mép gần nhất, giữ độ cao
    const { x: dx, y: dy } = dragXYRef.current
    const next: Pos = {
      side: dx + SIZE / 2 < vp.w / 2 ? 'left' : 'right',
      yRatio: maxY > minY ? clamp((dy - minY) / (maxY - minY), 0, 1) : 1,
    }
    dragXYRef.current = null
    suppressClick.current = true
    window.setTimeout(() => (suppressClick.current = false), 80)
    setPos(next)
    setDragXY(null)
    savePos(next)
  }
  const onClick = () => {
    if (suppressClick.current) return
    openMessenger()
  }

  // ---- Zoom từ nút: gốc biến đổi = tâm nút, tính theo hệ toạ độ của khung ----
  const updateOrigin = useCallback(() => {
    const panel = panelRef.current
    const wrap = wrapRef.current
    const btn = launcherRef.current
    if (!panel || !wrap || !btn) return
    const wr = wrap.getBoundingClientRect()
    const br = btn.getBoundingClientRect()
    const left = wr.left + (wr.width - panel.offsetWidth) / 2
    const top = wr.top + (wr.height - panel.offsetHeight) / 2
    panel.style.transformOrigin = `${br.left + br.width / 2 - left}px ${br.top + br.height / 2 - top}px`
  }, [])
  useLayoutEffect(() => {
    updateOrigin()
  }, [open, pos, vp, updateOrigin])

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

  // Khóa cuộn trang khi mở
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    // Trang công khai cuộn bằng Lenis: overflow hidden không chặn được → dừng Lenis luôn
    const lenis = getSmoothScroll()
    lenis?.stop()
    return () => {
      html.style.overflow = prev
      lenis?.start()
    }
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
          !dragXY && 'transition-transform duration-300 ease-editorial motion-reduce:transition-none',
        )}
        style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
      >
        <div
          className={cn(
            'relative transition-opacity duration-300 motion-reduce:transition-none',
            open && 'pointer-events-none opacity-0',
          )}
        >
          <button
            ref={launcherRef}
            type="button"
            onClick={onClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
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
