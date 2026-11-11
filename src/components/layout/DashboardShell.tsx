import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import { Briefcase, Bell, LogOut, Menu, X, ChevronRight, Search, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useUnreadCount } from '@services/connectionService'
import { useNotificationCenterStore } from '@context/notificationCenterStore'
import { cn } from '@utils/cn'
import RouteScroll from '@components/common/RouteScroll'
import { FOCUS } from '@utils/focus'

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Nhãn nhỏ cuối mục menu, vd. "Mới" */
  badge?: string
}

type ShellProps = {
  navItems: DashboardNavItem[]
  /** Tên vai trò hiện dưới email, vd. "Người tìm việc" */
  roleLabel: string
  /** Đường dẫn trang Tổng quan — chỉ sáng khi khớp chính xác */
  homeHref: string
  /** Ảnh nền Unsplash (chỉ phần id sau "photo-") — trang trí, theo vai trò */
  background: { id: string }
  /** Có = hiện ô tìm kiếm ở thanh trên; trả về URL đích khi gửi. Không truyền = ẩn ô */
  searchHref?: (q: string) => string
  searchPlaceholder?: string
}

/** Chỉ phần cần cho thanh bên / rail */
type NavProps = Pick<ShellProps, 'navItems' | 'roleLabel' | 'homeHref'>


const ITEM = 'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-300'

type SidebarProps = NavProps & {
  pathname: string
  /** Có = đang là drawer mobile */
  onClose?: () => void
}

/** Mục đang chọn: khớp chính xác với trang Tổng quan; mục khác khớp theo tiền tố đường dẫn. */
function isActive(pathname: string, href: string, homeHref: string) {
  if (href === homeHref) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

/** Thanh bên có nhãn (theme tối) — chỉ dùng trong drawer mobile/tablet. Khai báo ở cấp file (không lồng trong component khác) để không bị remount. */
function Sidebar({ navItems, roleLabel, homeHref, pathname, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }

  return (
    <aside className="theme-charcoal flex h-full w-full flex-col border-r border-page-line">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-page-line px-5">
        <Link to="/" className={cn('flex items-center gap-2 rounded-control font-display text-lg font-semibold', FOCUS)}>
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          Workmate
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className={cn('rounded-control p-2 transition-colors duration-300 hover:bg-page-surface', FOCUS)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Người dùng */}
      <div className="flex items-center gap-3 border-b border-page-line p-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-page-edge text-sm font-medium">
          {user?.email?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-page-muted">{roleLabel}</p>
        </div>
      </div>

      {/* Menu chính */}
      <nav aria-label="Menu chính" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(pathname, href, homeHref)
          return (
            <Link
              key={href}
              to={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                ITEM,
                'font-medium',
                active ? 'bg-page-fg text-page-bg' : 'text-page-muted hover:bg-page-surface hover:text-page-fg',
                FOCUS,
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {label}
              {badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full border px-2 py-0.5 text-xs font-medium',
                    active ? 'border-page-bg' : 'border-page-edge',
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Cuối thanh bên */}
      <div className="space-y-0.5 border-t border-page-line p-3">
        <Link to="/" className={cn(ITEM, 'text-page-muted hover:bg-page-surface hover:text-page-fg', FOCUS)}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          Về trang chủ
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(ITEM, 'text-page-muted hover:bg-page-surface hover:text-page-fg', FOCUS)}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

const ICON_BTN =
  'relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-300'

/** Tooltip CSS thuần: hiện bên phải khi hover hoặc focus bàn phím của phần tử cha (class group). */
function RailTip({ children }: { children: string }) {
  return (
    <span
      role="presentation"
      className={cn(
        'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-control',
        'border border-wm-ivory/20 bg-wm-charcoal px-3 py-1.5 text-xs font-medium text-wm-ivory',
        'opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none',
      )}
    >
      {children}
    </span>
  )
}

/**
 * Thanh icon nổi bên trái (chỉ lg+). Tooltip cần tràn ra ngoài rail nên nav KHÔNG đặt overflow
 * bình thường; chỉ khi màn hình thấp (<720px) mới cho cuộn dọc — lúc đó tooltip bị cắt
 * (vẫn còn aria-label) vì overflow-y khác visible buộc overflow-x cũng bị cắt.
 */
function Rail({ navItems, homeHref, pathname }: Omit<NavProps, 'roleLabel'> & { pathname: string }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }
  const idle = 'text-page-muted hover:bg-page-surface hover:text-page-fg'

  return (
    <aside className="glass-card relative z-30 flex h-full w-[72px] flex-col items-center rounded-full py-3">
      <Link to="/" aria-label="Workmate — về trang chủ" className={cn('group', ICON_BTN, idle, FOCUS)}>
        <Briefcase className="h-5 w-5" aria-hidden="true" />
        <RailTip>Workmate</RailTip>
      </Link>
      <nav
        aria-label="Menu chính"
        className="mt-2 flex min-h-0 flex-1 flex-col items-center gap-1 [@media(max-height:719px)]:overflow-y-auto"
      >
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(pathname, href, homeHref)
          return (
            <Link
              key={href}
              to={href}
              aria-label={badge ? `${label} (${badge})` : label}
              aria-current={active ? 'page' : undefined}
              className={cn('group flex-shrink-0', ICON_BTN, active ? 'bg-page-fg text-page-bg' : idle, FOCUS)}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {badge && (
                <span
                  className={cn(
                    'absolute right-2 top-2 h-2 w-2 rounded-full border',
                    active ? 'border-page-bg bg-page-bg' : 'border-page-bg bg-page-fg',
                  )}
                  aria-hidden="true"
                />
              )}
              <RailTip>{label}</RailTip>
            </Link>
          )
        })}
      </nav>
      <div className="mt-2 flex flex-col items-center gap-1 border-t border-page-line pt-2">
        <Link to="/" aria-label="Về trang chủ" className={cn('group', ICON_BTN, idle, FOCUS)}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
          <RailTip>Về trang chủ</RailTip>
        </Link>
        <button type="button" onClick={handleLogout} aria-label="Đăng xuất" className={cn('group', ICON_BTN, idle, FOCUS)}>
          <LogOut className="h-5 w-5" aria-hidden="true" />
          <RailTip>Đăng xuất</RailTip>
        </button>
      </div>
    </aside>
  )
}

/** Vạch tiến trình mảnh trên cùng khi trang đang tải (chỉ hiện nếu tải lâu hơn ~150ms) */
function LoadingBar() {
  return (
    <div role="progressbar" aria-label="Đang tải trang" className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div className="dash-loading h-full w-1/3 bg-page-fg" />
    </div>
  )
}

/**
 * Khung dùng chung cho 3 dashboard ("kính"): ảnh nền nội thất + rail icon nổi bên trái (lg+) +
 * thanh trên trong suốt + thẻ kính. Dưới lg dùng drawer có nhãn.
 * Dashboard yên tĩnh: chỉ transition màu, drawer mobile trượt và nội dung hiện dần khi đổi trang
 * (tắt khi giảm chuyển động).
 */
export default function DashboardShell({ navItems, roleLabel, homeHref, background, searchHref, searchPlaceholder }: ShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // Chấm trên chuông: chỉ hiện khi có thông báo chưa đọc của vai trò đang đăng nhập
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const initial = (user?.email?.[0] ?? 'U').toUpperCase()
  // Avatar dẫn tới trang cài đặt/hồ sơ của vai trò nếu có trong menu
  const settingsHref = navItems.find((n) => n.href.endsWith('/cai-dat'))?.href
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (searchHref && q) navigate(searchHref(q))
  }
  const bgUrl = `https://images.unsplash.com/photo-${background.id}`
  const unreadSeeker = useUnreadCount('seeker')
  const unreadRecruiter = useUnreadCount('recruiter')
  const openNotificationCenter = useNotificationCenterStore((s) => s.openCenter)
  const setInShell = useNotificationCenterStore((s) => s.setInShell)
  useEffect(() => {
    setInShell(true)
    return () => setInShell(false)
  }, [setInShell])
  const hasUnread = (role === 'jobseeker' ? unreadSeeker : role === 'recruiter' ? unreadRecruiter : 0) > 0

  // Đổi route thì đóng drawer
  useEffect(() => setDrawerOpen(false), [location.pathname])

  // Phím Escape đóng drawer
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const sidebarProps = { navItems, roleLabel, homeHref, pathname: location.pathname }

  return (
    <div className="theme-glass relative isolate flex h-screen overflow-hidden bg-wm-charcoal">
      {/* Ảnh nền trang trí + lớp phủ than chì đặc (không gradient) để chữ luôn dễ đọc */}
      <img
        src={`${bgUrl}?w=1920&q=70&auto=format&fit=crop`}
        srcSet={`${bgUrl}?w=800&q=70&auto=format&fit=crop 800w, ${bgUrl}?w=1920&q=70&auto=format&fit=crop 1920w`}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-wm-charcoal/75" aria-hidden="true" />

      <a
        href="#dashboard-main"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]',
          'focus:rounded-full focus:bg-page-fg focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-page-bg',
          FOCUS,
        )}
      >
        Bỏ qua tới nội dung
      </a>

      {/* Rail icon nổi (desktop) */}
      <div className="hidden flex-shrink-0 p-4 pr-0 lg:block">
        <Rail navItems={navItems} homeHref={homeHref} pathname={location.pathname} />
      </div>

      {/* Drawer mobile: luôn có trong DOM để trượt mượt; lúc đóng thì ẩn khỏi bàn phím/trình đọc màn hình */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', !drawerOpen && 'pointer-events-none')}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            'absolute inset-0 bg-wm-charcoal/40 transition-opacity duration-300 motion-reduce:transition-none',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 transition-[transform,visibility] duration-300 ease-editorial motion-reduce:transition-none',
            drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
          )}
        >
          <Sidebar {...sidebarProps} onClose={() => setDrawerOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Thanh trên trong suốt: nhãn vai trò · tìm kiếm · chuông + avatar.
            Căn cùng bề ngang max-w-6xl với nội dung để mép trái thẳng hàng tiêu đề trang;
            lời chào đã có ở tiêu đề từng trang nên không lặp ở đây. */}
        <header className="flex h-16 flex-shrink-0 items-center px-4 md:h-20 md:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            aria-expanded={drawerOpen}
            className={cn('rounded-full p-2.5 transition-colors duration-300 hover:bg-page-surface lg:hidden', FOCUS)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 md:w-56 md:flex-shrink-0">
            <span className="glass-card inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{roleLabel}</span>
            </span>
          </div>
          {searchHref ? (
            <form role="search" onSubmit={onSearch} className="mx-auto hidden w-full max-w-md md:block">
              <label className="glass-card relative flex items-center rounded-full">
                <span className="sr-only">Tìm kiếm</span>
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-page-muted" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder ?? 'Tìm kiếm…'}
                  className={cn('w-full rounded-full bg-transparent py-2.5 pl-11 pr-4 text-sm text-page-fg placeholder:text-page-muted', FOCUS)}
                />
              </label>
            </form>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {/* Trung tâm thông báo chỉ có cho người tìm việc / nhà tuyển dụng (NotificationCenter) */}
            {(role === 'jobseeker' || role === 'recruiter') && (
            <button
              type="button"
              onClick={openNotificationCenter}
              aria-haspopup="dialog"
              aria-label={hasUnread ? 'Thông báo (có thông báo chưa đọc)' : 'Thông báo'}
              className={cn('glass-card relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 hover:border-page-fg', FOCUS)}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-page-fg" aria-hidden="true" />}
            </button>
            )}
            {settingsHref ? (
              <Link
                to={settingsHref}
                aria-label={`Tài khoản ${user?.email ?? ''} — mở cài đặt`}
                className={cn('flex h-10 w-10 items-center justify-center rounded-full bg-page-fg text-sm font-medium text-page-bg', FOCUS)}
              >
                {initial}
              </Link>
            ) : (
              <span
                role="img"
                aria-label={`Tài khoản ${user?.email ?? ''}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-page-fg text-sm font-medium text-page-bg"
              >
                {initial}
              </span>
            )}
          </div>
          </div>
        </header>

        {/* Nội dung */}
        <main id="dashboard-main" ref={mainRef} className="relative flex-1 overflow-y-auto px-4 pb-4 pt-2 md:px-8 md:pb-8">
          {/* Trang được tải theo nhu cầu (xem App.tsx). RouteScroll nằm cùng Suspense
              để chỉ đặt vị trí cuộn khi nội dung trang đã có. */}
          <Suspense fallback={<LoadingBar />}>
            {/* key theo route → mỗi trang mới hiện dần + trượt lên rất nhẹ (dash-enter, index.css) */}
            <div key={`page:${location.pathname}`} className="dash-enter mx-auto max-w-6xl">
              <Outlet />
            </div>
            {/* key theo route → remount mỗi lần đổi trang, xem RouteScroll */}
            <RouteScroll key={location.pathname} container={mainRef} />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
