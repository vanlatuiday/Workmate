import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { PanelLeft } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useNotificationCenterStore } from '@context/notificationCenterStore'
import { ROLE_AREAS } from '@constants/roles'
import { PERSONAL_HREF } from '@pages/public/personal/links'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import RouteScroll from '@components/common/RouteScroll'
import Skeleton, { SkeletonStats } from '@components/dashboard/Skeleton'
import MenuOverlay from './MenuOverlay'
import { EXPLORE_ITEMS } from './ExploreMenu'
import SiteHeader from './SiteHeader'
import { NAV } from './navLinks'
import Sidebar from './sidebar/Sidebar'
import MobileDrawer from './sidebar/MobileDrawer'
import type { SidebarRole } from './sidebar/config'

const MENU_ID = 'site-menu'

/** Khung chờ khi chunk trang đang tải (cùng ý với DashboardShell, màu kính xanh) */
function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl">
      <div role="progressbar" aria-label="Đang tải trang" className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
        <div className="dash-loading h-full w-1/3 bg-wm-cyan" />
      </div>
      <Skeleton className="mb-6 h-8 w-64 md:mb-8" />
      <SkeletonStats />
      <Skeleton className="mt-6 h-56 w-full rounded-card" />
    </div>
  )
}

/**
 * Khung "xanh kính" cho dashboard người tìm việc (/tim-viec/*) và nhà tuyển dụng (/tuyen-dung/*; sidebarRole + menuLabel đổi theo vai trò), chủ dự án 2026-11-21; DESIGN.md → Dashboard người tìm việc).
 * Khác DashboardShell (ngà, dùng cho nhà tuyển dụng / quản trị — giữ nguyên): trang cuộn theo cửa sổ,
 * trên cùng là header công khai (SiteHeader, viên kính nổi, thu nhỏ khi cuộn), thanh bên kính xanh dính bên trái (md+),
 * dưới md dùng ngăn kéo mở bằng nút "Menu khu tìm việc". `.theme-abyss` đổi biến --page-* sang chữ ngà trên xanh
 * nên các trang con tự đổi màu; lớp `.jd-root` (index.css) ghi đè các kính ngà cũ. Nền tĩnh, không hiệu ứng theo cuộn.
 */
export default function GlassDashboardShell({ sidebarRole, menuLabel = 'Menu khu tìm việc' }: { sidebarRole: SidebarRole; menuLabel?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const setInShell = useNotificationCenterStore((s) => s.setInShell)
  useEffect(() => {
    setInShell(true)
    return () => setInShell(false)
  }, [setInShell])

  // Đổi route thì đóng ngăn kéo và menu phủ
  useEffect(() => {
    setDrawerOpen(false)
    setMenuOpen(false)
  }, [location.pathname])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const area = user ? ROLE_AREAS[user.role] : null
  const navLinks = NAV[user?.role ?? 'guest']

  return (
    <div className="jd-root theme-abyss relative isolate min-h-screen">
      <div aria-hidden="true" className="jd-backdrop pointer-events-none fixed inset-0 -z-10">
        <div className="home-stars absolute inset-0" />
      </div>
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

      <SiteHeader home={false} surface="dark" menuOpen={menuOpen} menuId={MENU_ID} onOpenMenu={() => setMenuOpen(true)} />
      <MenuOverlay
        id={MENU_ID}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[...navLinks, ...EXPLORE_ITEMS, { label: 'Trang cá nhân', href: PERSONAL_HREF }]}
        actions={[
          { label: 'Đăng xuất', onClick: logout },
          { label: area?.label ?? '', href: area?.home ?? '/tim-viec' },
        ]}
      />

      {/* Ngăn kéo mobile (<768px) */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} returnFocusRef={menuBtnRef}>
        <Sidebar role={sidebarRole} variant="drawer" onClose={closeDrawer} glass />
      </MobileDrawer>

      <div className="flex gap-6 px-4 pt-[88px] md:px-6">
        {/* Thanh bên kính nổi (md+): dính dưới header, rộng 260/72px */}
        <div className="hidden flex-shrink-0 md:block">
          <div className="sticky top-[88px] h-[calc(100vh-104px)]">
            <Sidebar role={sidebarRole} variant="desktop" glass />
          </div>
        </div>

        <main id="dashboard-main" className="min-w-0 flex-1 pb-24 md:pb-10">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              ref={menuBtnRef}
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu"
              aria-expanded={drawerOpen}
              className={cn('jd-card mb-4 inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-page-fg md:hidden', FOCUS)}
            >
              <PanelLeft className="h-4 w-4 text-wm-cyan" aria-hidden="true" />
              {menuLabel}
            </button>
            <Suspense fallback={<PageFallback />}>
              {/* key theo route → mỗi trang mới hiện dần + trượt lên rất nhẹ (dash-enter, index.css) */}
              <div key={`page:${location.pathname}`} className="dash-enter">
                <Outlet />
              </div>
              <RouteScroll key={location.pathname} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
