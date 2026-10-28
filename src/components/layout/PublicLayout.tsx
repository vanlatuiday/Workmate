import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X, Briefcase } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuthStore } from '@context/authStore'
import { ROLE_AREAS } from '@constants/roles'
import type { UserRole } from '@/types'
import { cn } from '@utils/cn'
import MenuOverlay, { type MenuItem } from '@components/layout/MenuOverlay'
import AccountMenu from '@components/layout/AccountMenu'
import RouteScroll from '@components/common/RouteScroll'
import PageCurtain, { useCurtainNavigate } from '@components/motion/PageCurtain'
import PageTransition from '@components/motion/PageTransition'
import { PERSONAL_HREF } from '@pages/public/personal/links'
import RollText from '@components/motion/RollText'
import { FOCUS } from '@utils/focus'
import { useReducedMotion } from '@hooks/useReducedMotion'

/** Mục điều hướng theo người đang xem. Khách thấy lời mời trung lập cho cả hai phía;
    đã đăng nhập thì chỉ thấy lối tắt tới việc của vai trò mình. */
const NAV: Record<UserRole | 'guest', MenuItem[]> = {
  guest: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Nhà tuyển dụng', href: '/dang-ky?role=recruiter' },
    { label: 'Kết nối', href: '/match' },
  ],
  jobseeker: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Việc phù hợp', href: '/tim-viec/phu-hop' },
    { label: 'Kết nối', href: '/match' },
  ],
  // Tối đa 3 mục để header gọn; các trang khác của nhà tuyển dụng nằm trong khu tuyển dụng
  recruiter: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Kết nối', href: '/match' },
    { label: 'Đăng tin', href: '/tuyen-dung/dang-tin' },
  ],
  admin: [
    { label: 'Xác minh', href: '/admin/xac-minh' },
    { label: 'Người dùng', href: '/admin/nguoi-dung' },
  ],
}


/** Link nhỏ trong footer */
const FOOT_LINK = `link-underline rounded-control hover:text-page-fg ${FOCUS}`


/**
 * Giữ nguyên trang đã render lúc mount. Khi AnimatePresence giữ trang cũ lại
 * để fade-out, `<Outlet />` thường sẽ đổi sang route mới ngay lập tức — trang
 * cũ biến mất, trang mới hiện hai lần, và chiều cao tài liệu co lại giữa chừng.
 */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const reduced = useReducedMotion()

  // Trang chủ dùng nền tối (page-* do useSectionThemes điều khiển); các trang còn lại dùng theme ngà.
  // `dark` phải đổi ngay khi đổi route: IntroHero tìm data-brand-logo… lúc mount.
  // Theme ngà gắn vào header, footer và khung của TỪNG trang (không gắn lên wrapper),
  // nên trang cũ đang mờ dần vẫn giữ màu của chính nó.
  const dark = location.pathname === '/'
  // Trang Cá nhân là "mặt bàn" tối → header/footer tối theo cho liền mạch
  const chrome = location.pathname === '/ca-nhan' ? 'theme-charcoal' : 'theme-ivory'

  // Đóng mọi menu khi chuyển trang
  useEffect(() => {
    setMobileOpen(false)
    setOverlayOpen(false)
  }, [location.pathname])

  // Đã đăng nhập: nút dẫn vào đúng khu làm việc của vai trò
  const area = user ? ROLE_AREAS[user.role] : null
  const dashboardHref = area?.home ?? '/tim-viec'
  const navLinks = NAV[user?.role ?? 'guest']
  // Nav chính hiện từ md; trang chủ từ lg (tablet không đủ chỗ cạnh logo lớn của intro).
  // Hẹp hơn thì dùng nút menu (dropdown / menu phủ). Class viết đủ để Tailwind nhận ra.
  const navShow = dark ? 'lg:flex' : 'md:flex'
  const navHide = dark ? 'lg:hidden' : 'md:hidden'

  // Trang cá nhân: đã đăng nhập → mở bằng màn phủ từ trên xuống (cùng hướng menu phủ cũ);
  // khách → sang đăng nhập, xong quay lại trang cá nhân.
  const curtainGo = useCurtainNavigate()
  const navigate = useNavigate()
  const profileTo = user ? PERSONAL_HREF : '/dang-nhap'
  const openProfile = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (user) curtainGo(PERSONAL_HREF, 'Trang cá nhân', undefined, 'down')
    else navigate('/dang-nhap', { state: { from: PERSONAL_HREF } })
  }

  return (
    <div className="min-h-screen flex flex-col bg-page-bg">
      {/* Header. Trang chủ: cố định trên cùng, màu theo section đang xem (biến --page-*),
          và được IntroHero điều khiển qua các data-attribute bên dưới:
            data-brand-logo  — logo đi từ giữa màn hình vào header
            data-header-item — các cụm hiện dần khi logo đã về chỗ
            data-header-bg   — nền header, chỉ hiện sau intro
          Mặc định mọi thứ ở trạng thái cuối, nên không có JS vẫn dùng được.
          Trang khác: sticky, nền và viền lấy thẳng từ theme ngà. */}
      <header
        className={cn(
          'top-0 z-40 text-page-fg',
          // header-theme: màu chuyển dần khi đổi giữa theme ngà và than chì (index.css)
          dark ? 'fixed inset-x-0' : `sticky header-theme ${chrome} border-b border-page-line`,
        )}
      >
        {dark && (
          <div data-header-bg aria-hidden className="absolute inset-0 -z-10 bg-page-bg border-b border-page-line" />
        )}
        <div className="shell">
          {/* Lưới 3 cột: logo | nav đúng giữa header | cụm bên phải */}
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-x-6">
            {/* Logo */}
            <Link
              to="/"
              data-brand-logo={dark ? '' : undefined}
              className={cn(
                'justify-self-start flex items-center gap-2 font-display font-semibold text-xl tracking-tight text-page-fg rounded-control',
                FOCUS,
              )}
            >
              {/* Hiện dần rất nhẹ lúc mở trang — chạy trên phần tử con vì transform
                  của chính logo do intro điều khiển */}
              <span className={cn('flex items-center gap-2', dark && 'animate-logo-in')}>
                <Briefcase className="w-5 h-5" />
                Workmate
              </span>
            </Link>

            {/* Desktop nav */}
            {/* Nav chính chỉ hiện từ md (trang chủ: lg) — hẹp hơn thì không đủ chỗ,
                các link này đã có trong menu phủ hoặc dropdown */}
            <nav
              data-header-item={dark ? '' : undefined}
              className={cn('hidden items-center gap-1 whitespace-nowrap', navShow)}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={location.pathname === link.href ? 'page' : undefined}
                  className={cn(
                    'group relative px-3 py-2 rounded-control text-sm font-medium transition-colors',
                    location.pathname === link.href ? 'text-page-fg' : 'text-page-muted hover:text-page-fg',
                    FOCUS,
                  )}
                >
                  <RollText>{link.label}</RollText>
                  {/* Gạch chân mục đang chọn — cùng layoutId nên trượt sang mục mới khi đổi trang */}
                  {location.pathname === link.href && (
                    <motion.span
                      layoutId="nav-underline"
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-1 h-px bg-page-fg"
                      transition={reduced ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Bên phải: đã đăng nhập → một nút tài khoản (khu làm việc, trang cá nhân, đăng xuất);
                khách → chỉ Đăng nhập / Đăng ký. Cùng một cụm để intro trang chủ hiện một lần. */}
            <div className="flex items-center justify-end gap-1">
              <div data-header-item={dark ? '' : undefined} className="hidden md:flex items-center gap-1 whitespace-nowrap">
                {user && area ? (
                  <AccountMenu
                    initial={user.email?.[0]?.toUpperCase() ?? 'U'}
                    area={{ label: area.label, href: dashboardHref }}
                    profileHref={profileTo}
                    onOpenProfile={openProfile}
                    onLogout={logout}
                    magnetic={dark}
                  />
                ) : (
                  <>
                    <Link
                      to="/dang-nhap"
                      className={cn('group text-sm text-page-muted hover:text-page-fg transition-colors px-2 py-2 rounded-control', FOCUS)}
                    >
                      <RollText>Đăng nhập</RollText>
                    </Link>
                    <span aria-hidden="true" className="text-sm text-page-muted">/</span>
                    <Link
                      to="/dang-ky"
                      className={cn('group text-sm text-page-muted hover:text-page-fg transition-colors px-2 py-2 rounded-control', FOCUS)}
                    >
                      <RollText>Đăng ký</RollText>
                    </Link>
                  </>
                )}
              </div>

              {/* Trang chủ: menu phủ toàn màn hình khi nav chính ẩn (dưới lg); trang khác giữ dropdown (dưới md) */}
              {dark ? (
                // Bọc ngoài để GSAP (intro) và Magnetic không tranh nhau transform của cùng một phần tử
                <div data-header-item className={navHide}>
                  <button
                    onClick={() => setOverlayOpen(true)}
                    aria-expanded={overlayOpen}
                    aria-label="Mở menu"
                    className={cn(
                      'flex items-center p-2 -mr-2 text-page-muted hover:text-page-fg transition-colors rounded-control',
                      FOCUS,
                    )}
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  className={cn(
                    navHide,
                    'p-2 -mr-2 rounded-control transition-colors text-page-muted hover:text-page-fg',
                    FOCUS,
                  )}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-expanded={mobileOpen}
                  aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown khi nav chính ẩn — chỉ dùng cho các trang ngoài trang chủ */}
        {mobileOpen && !dark && (
          <div className={cn(navHide, 'border-t border-page-line bg-page-bg px-6 pb-4 pt-2 space-y-1')}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={location.pathname === link.href ? 'page' : undefined}
                className={cn(
                  'block px-3 py-2 rounded-control text-sm transition-colors hover:bg-page-surface',
                  location.pathname === link.href ? 'text-page-fg font-medium' : 'text-page-muted hover:text-page-fg',
                  FOCUS,
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to={profileTo}
              onClick={(e) => {
                setMobileOpen(false)
                openProfile(e)
              }}
              className={cn('block px-3 py-2 rounded-control text-sm text-page-muted transition-colors hover:bg-page-surface hover:text-page-fg', FOCUS)}
            >
              Trang cá nhân
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={dashboardHref}
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-opacity bg-page-fg text-page-bg hover:opacity-90',
                      FOCUS,
                    )}
                  >
                    {area?.label}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-colors border border-page-fg text-page-fg hover:bg-page-surface',
                      FOCUS,
                    )}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/dang-nhap"
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-colors border border-page-fg text-page-fg hover:bg-page-surface',
                      FOCUS,
                    )}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/dang-ky"
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-opacity bg-page-fg text-page-bg hover:opacity-90',
                      FOCUS,
                    )}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <MenuOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        items={[...navLinks, { label: 'Trang cá nhân', href: profileTo }]}
        actions={
          user
            ? [{ label: area?.label ?? '', href: dashboardHref }]
            : [
                { label: 'Đăng nhập', href: '/dang-nhap' },
                { label: 'Đăng ký', href: '/dang-ky' },
              ]
        }
      />

      {/* Page content — đổi route: trang cũ mờ đi nhanh, trang mới trượt từ trên xuống vào chỗ */}
      <main className={cn('flex-1', !dark && 'flex flex-col')}>
        <AnimatePresence mode="wait">
          {/* Trang đang mờ đi giữ nguyên className cũ (AnimatePresence giữ element cũ),
              nên theme ngà/tối của nó không bị đổi giữa chừng */}
          <PageTransition key={location.pathname} className={dark ? undefined : 'theme-ivory flex-1'}>
            <FrozenOutlet />
            {/* Đứng sau FrozenOutlet: chạy khi trang mới đã dựng xong (kể cả pin của trang chủ) */}
            <RouteScroll />
          </PageTransition>
        </AnimatePresence>
      </main>

      <PageCurtain />

      {/* Footer */}
      <footer className={cn('border-t bg-page-bg border-page-line', !dark && chrome)}>
        <div className="shell py-section-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className={cn(
                  'inline-flex items-center gap-2 font-display font-semibold text-lg mb-3 text-page-fg rounded-control',
                  FOCUS,
                )}
              >
                <Briefcase className="w-5 h-5" />
                Workmate
              </Link>
              <p className="text-sm leading-relaxed text-page-muted">
                Nền tảng kết nối việc làm linh hoạt dành cho sinh viên và người lao động.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.18em] mb-4 text-page-muted">Tìm việc</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/viec-lam?type=part-time" className={FOOT_LINK}>Part-time</Link></li>
                <li><Link to="/viec-lam?type=full-time" className={FOOT_LINK}>Full-time</Link></li>
                <li><Link to="/viec-lam?nearMe=true" className={FOOT_LINK}>Gần tôi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.18em] mb-4 text-page-muted">Nhà tuyển dụng</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/dang-ky" className={FOOT_LINK}>Đăng tin miễn phí</Link></li>
                <li><Link to="/tuyen-dung" className={FOOT_LINK}>Quản lý tuyển dụng</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.18em] mb-4 text-page-muted">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/cam-nang" className={FOOT_LINK}>Cẩm nang nghề nghiệp</Link></li>
                <li><a href="mailto:support@workmate.vn" className={FOOT_LINK}>Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-page-line text-page-muted">
            <p>© 2026 Workmate. All rights reserved.</p>
            <a href="mailto:support@workmate.vn" className={FOOT_LINK}>
              support@workmate.vn
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
