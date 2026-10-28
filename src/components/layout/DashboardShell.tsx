import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Briefcase, Bell, LogOut, Menu, X, ChevronRight, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useUnreadCount } from '@services/connectionService'
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
}


const ITEM = 'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-300'

type SidebarProps = ShellProps & {
  pathname: string
  /** Có = đang là drawer mobile */
  onClose?: () => void
}

/** Mục đang chọn: khớp chính xác với trang Tổng quan; mục khác khớp theo tiền tố đường dẫn. */
function isActive(pathname: string, href: string, homeHref: string) {
  if (href === homeHref) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

/** Thanh bên theme tối. Khai báo ở cấp file (không lồng trong component khác) để không bị remount. */
function Sidebar({ navItems, roleLabel, homeHref, pathname, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }

  return (
    <aside className="theme-charcoal flex h-full w-full flex-col">
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

/** Vạch tiến trình mảnh trên cùng khi trang đang tải (chỉ hiện nếu tải lâu hơn ~150ms) */
function LoadingBar() {
  return (
    <div role="progressbar" aria-label="Đang tải trang" className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div className="dash-loading h-full w-1/3 bg-page-fg" />
    </div>
  )
}

/**
 * Khung dùng chung cho 3 dashboard: thanh bên tối + thanh trên và vùng nội dung theme ngà.
 * Dashboard yên tĩnh: chỉ transition màu, drawer mobile trượt và nội dung hiện dần khi đổi trang
 * (tắt khi giảm chuyển động).
 */
export default function DashboardShell({ navItems, roleLabel, homeHref }: ShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  // Chấm trên chuông: chỉ hiện khi có thông báo chưa đọc của vai trò đang đăng nhập
  const role = useAuthStore((s) => s.user?.role)
  const unreadSeeker = useUnreadCount('seeker')
  const unreadRecruiter = useUnreadCount('recruiter')
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
    <div className="theme-ivory flex h-screen overflow-hidden">
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

      {/* Thanh bên desktop */}
      <div className="hidden w-64 flex-shrink-0 lg:block">
        <Sidebar {...sidebarProps} />
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
        {/* Thanh trên */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-page-line bg-page-bg px-4 md:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            aria-expanded={drawerOpen}
            className={cn('rounded-control p-2 transition-colors duration-300 hover:bg-page-surface lg:hidden', FOCUS)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <Link
            to="/thong-bao"
            aria-label={hasUnread ? 'Thông báo (có thông báo chưa đọc)' : 'Thông báo'}
            className={cn('relative rounded-control p-2 transition-colors duration-300 hover:bg-page-surface', FOCUS)}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-page-fg" aria-hidden="true" />}
          </Link>
        </header>

        {/* Nội dung */}
        <main id="dashboard-main" ref={mainRef} className="relative flex-1 overflow-y-auto p-4 md:p-8">
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
