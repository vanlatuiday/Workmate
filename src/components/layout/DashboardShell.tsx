import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Briefcase, Bell, Menu, Search } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useUnreadCount } from '@services/connectionService'
import { useNotificationCenterStore } from '@context/notificationCenterStore'
import { cn } from '@utils/cn'
import RouteScroll from '@components/common/RouteScroll'
import { FOCUS } from '@utils/focus'
import { BTN_ICON } from '@utils/ui'
import Sidebar from './sidebar/Sidebar'
import MobileDrawer from './sidebar/MobileDrawer'
import { SIDEBAR_CONFIG, type SidebarRole } from './sidebar/config'
import Skeleton, { SkeletonStats } from '@components/dashboard/Skeleton'

type ShellProps = {
  /** Vai trò → chọn bộ menu thanh bên (sidebar/config.ts) */
  sidebarRole: SidebarRole
  /** Tên vai trò hiện ở chip thanh trên, vd. "Người tìm việc" */
  roleLabel: string
  /** Có = hiện ô tìm kiếm ở thanh trên; trả về URL đích khi gửi. Không truyền = ẩn ô */
  searchHref?: (q: string) => string
  searchPlaceholder?: string
}

/** Vạch tiến trình mảnh trên cùng khi trang đang tải (chỉ hiện nếu tải lâu hơn ~150ms) */
function LoadingBar() {
  return (
    <div role="progressbar" aria-label="Đang tải trang" className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div className="dash-loading h-full w-1/3 bg-page-fg" />
    </div>
  )
}

/** Khung chờ khi chunk trang đang tải: vạch tiến trình + khối xám đúng bố cục (tiêu đề, ô số liệu, thẻ). */
function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl">
      <LoadingBar />
      <Skeleton className="mb-6 h-8 w-64 md:mb-8" />
      <SkeletonStats />
      <Skeleton className="mt-6 h-56 w-full rounded-card" />
    </div>
  )
}

/**
 * Khung dùng chung cho 3 dashboard (nền ngà phẳng): thanh bên kính nổi bên trái (md+) +
 * thanh trên + thẻ đặc. Dưới md dùng drawer.
 * Dashboard yên tĩnh: chỉ transition màu, drawer mobile trượt và nội dung hiện dần khi đổi trang
 * (tắt khi giảm chuyển động).
 */
export default function DashboardShell({ sidebarRole, roleLabel, searchHref, searchPlaceholder }: ShellProps) {
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
  const settingsHref = SIDEBAR_CONFIG[sidebarRole].settingsHref
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (searchHref && q) navigate(searchHref(q))
  }
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

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <div className="theme-ivory dash-bg relative isolate flex h-screen overflow-hidden">
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

      {/* Thanh bên kính nổi (md+): bề rộng 260/72px, nội dung bên cạnh co giãn theo */}
      <div className="hidden flex-shrink-0 p-4 pr-0 md:block">
        <Sidebar role={sidebarRole} variant="desktop" />
      </div>

      {/* Ngăn kéo mobile (<768px) */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} returnFocusRef={menuBtnRef}>
        <Sidebar role={sidebarRole} variant="drawer" onClose={closeDrawer} />
      </MobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Thanh trên trong suốt: nhãn vai trò · tìm kiếm · chuông + avatar.
            Căn cùng bề ngang max-w-6xl với nội dung để mép trái thẳng hàng tiêu đề trang;
            lời chào đã có ở tiêu đề từng trang nên không lặp ở đây. */}
        <header className="flex h-16 flex-shrink-0 items-center px-4 md:h-20 md:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 md:gap-6">
          <button
            type="button"
            ref={menuBtnRef}
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            aria-expanded={drawerOpen}
            className={cn('rounded-full p-2.5 transition-colors duration-fast hover:bg-page-surface md:hidden', FOCUS)}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0 md:w-56 md:flex-shrink-0">
            <span className="border border-page-line bg-page-surface inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Briefcase className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{roleLabel}</span>
            </span>
          </div>
          {searchHref ? (
            <form role="search" onSubmit={onSearch} className="mx-auto hidden w-full max-w-md md:block">
              <label className="relative flex items-center rounded-full border border-page-line bg-page-surface">
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
              className={cn(BTN_ICON, 'relative bg-page-surface')}
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-page-fg" aria-hidden="true" />}
            </button>
            )}
            {settingsHref ? (
              <Link
                to={settingsHref}
                aria-label={`Mở cài đặt tài khoản ${user?.email ?? ''}`}
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
        <main id="dashboard-main" ref={mainRef} className="relative flex-1 overflow-y-auto px-4 pb-24 pt-2 md:px-8 md:pb-8">
          {/* Trang được tải theo nhu cầu (xem App.tsx). RouteScroll nằm cùng Suspense
              để chỉ đặt vị trí cuộn khi nội dung trang đã có. */}
          <Suspense fallback={<PageFallback />}>
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
