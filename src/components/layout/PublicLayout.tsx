import { Link, useLocation, useOutlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X, Briefcase, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import MenuOverlay, { type MenuItem } from '@components/layout/MenuOverlay'
import RouteScroll from '@components/common/RouteScroll'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'

const navLinks = [
  { label: 'Tìm việc', href: '/viec-lam' },
  {
    label: 'Loại việc',
    children: [
      { label: 'Việc làm Part-time', href: '/viec-lam?type=part-time' },
      { label: 'Việc làm Full-time', href: '/viec-lam?type=full-time' },
      { label: 'Việc làm gần tôi', href: '/viec-lam?nearMe=true' },
    ],
  },
  { label: 'Công ty', href: '/cong-ty' },
  { label: 'Cẩm nang', href: '/cam-nang' },
]

/** Danh sách phẳng dùng cho menu phủ toàn màn hình ở trang chủ. */
const overlayLinks: MenuItem[] = [
  { label: 'Tìm việc', href: '/viec-lam' },
  { label: 'Công ty', href: '/cong-ty' },
  { label: 'Cẩm nang', href: '/cam-nang' },
  { label: 'Việc làm gần tôi', href: '/viec-lam?nearMe=true' },
]

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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user } = useAuthStore()
  const location = useLocation()

  // Trang chủ dùng nền tối, các trang còn lại nền sáng
  const dark = location.pathname === '/'

  // Đóng mọi menu khi chuyển trang
  useEffect(() => {
    setMobileOpen(false)
    setOverlayOpen(false)
  }, [location.pathname])

  const dashboardHref =
    user?.role === 'recruiter' ? '/tuyen-dung' :
    user?.role === 'admin'     ? '/admin' :
    '/tim-viec'

  return (
    <div className={cn('min-h-screen flex flex-col', dark ? 'bg-page-bg' : 'bg-gray-50')}>
      {/* Header. Trang chủ: cố định trên cùng, màu theo section đang xem (biến --page-*),
          và được IntroHero điều khiển qua các data-attribute bên dưới:
            data-brand-logo  — logo đi từ giữa màn hình vào header
            data-header-item — các cụm hiện dần khi logo đã về chỗ
            data-header-bg   — nền header, chỉ hiện sau intro
          Mặc định mọi thứ ở trạng thái cuối, nên không có JS vẫn dùng được. */}
      <header
        className={cn(
          'top-0 z-40',
          dark ? 'fixed inset-x-0 text-page-fg' : 'sticky bg-white border-b border-gray-200',
        )}
      >
        {dark && (
          <div data-header-bg aria-hidden className="absolute inset-0 -z-10 bg-page-bg border-b border-page-line" />
        )}
        <div className={dark ? 'shell' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              data-brand-logo={dark ? '' : undefined}
              className={cn(
                'flex items-center gap-2 font-display font-semibold text-xl tracking-tight',
                dark ? 'text-page-fg' : 'text-primary-600',
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
            {/* Trang chủ: nav chính chỉ hiện từ lg — ở tablet không đủ chỗ (chữ bị xuống
                dòng), các link này đã có trong menu phủ toàn màn hình */}
            <nav
              data-header-item={dark ? '' : undefined}
              className={cn('hidden items-center gap-1 whitespace-nowrap', dark ? 'lg:flex' : 'md:flex')}
            >
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={cn(
                        'group flex items-center gap-1 px-3 py-2 rounded-control text-sm font-medium transition-colors',
                        dark
                          ? 'text-page-muted hover:text-page-fg'
                          : 'text-gray-600 hover:bg-gray-100',
                      )}
                    >
                      <RollText>{link.label}</RollText>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {dropdownOpen && (
                      <div
                        className={cn(
                          'absolute top-full left-0 mt-1 w-52 rounded-xl border py-1 z-50',
                          dark
                            ? 'bg-page-bg border-page-line'
                            : 'bg-white border-gray-200 shadow-lg',
                        )}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setDropdownOpen(false)}
                            className={cn(
                              'block px-4 py-2 text-sm transition-colors',
                              dark
                                ? 'text-page-muted hover:text-page-fg hover:bg-page-surface'
                                : 'text-gray-700 hover:bg-gray-50',
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href!}
                    className={cn(
                      'group px-3 py-2 rounded-control text-sm font-medium transition-colors',
                      dark
                        ? location.pathname === link.href
                          ? 'text-page-fg'
                          : 'text-page-muted hover:text-page-fg'
                        : location.pathname === link.href
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    <RollText>{link.label}</RollText>
                  </Link>
                ),
              )}
            </nav>

            {/* Auth buttons */}
            <div data-header-item={dark ? '' : undefined} className="hidden md:flex items-center gap-2 whitespace-nowrap">
              {user ? (
                <Link
                  to={dashboardHref}
                  className={cn(
                    'text-sm font-medium px-5 py-2 rounded-full transition-colors',
                    dark ? 'bg-page-fg text-page-bg hover:opacity-90' : 'btn-primary',
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/dang-nhap"
                    className={cn(
                      'group text-sm font-medium transition-colors',
                      dark
                        ? 'text-page-muted hover:text-page-fg px-3 py-2'
                        : 'btn-secondary',
                    )}
                  >
                    <RollText>Đăng nhập</RollText>
                  </Link>
                  {/* Nút nam châm chỉ ở trang chủ — các trang làm việc giữ yên tĩnh */}
                  <Magnetic strength={dark ? 0.3 : 0}>
                    <Link
                      to="/dang-ky"
                      className={cn(
                        'group block text-sm font-medium px-5 py-2 rounded-full transition-colors',
                        dark ? 'bg-page-fg text-page-bg hover:opacity-90' : 'btn-primary',
                      )}
                    >
                      <RollText>Đăng ký</RollText>
                    </Link>
                  </Magnetic>
                </>
              )}
            </div>

            {/* Trang chủ dùng menu phủ toàn màn hình; trang khác giữ dropdown mobile */}
            {dark ? (
              // Bọc ngoài để GSAP (intro) và Magnetic không tranh nhau transform của cùng một phần tử
              <div data-header-item>
              <Magnetic>
                <button
                  onClick={() => setOverlayOpen(true)}
                  aria-expanded={overlayOpen}
                  aria-label="Mở menu"
                  className="group flex items-center gap-2 text-sm text-page-muted hover:text-page-fg
                             transition-colors p-2 -mr-2 rounded-control"
                >
                  <span className="hidden sm:inline">
                    <RollText>Menu</RollText>
                  </span>
                  <Menu className="w-5 h-5" />
                </button>
              </Magnetic>
              </div>
            ) : (
              <button
                className="md:hidden p-2 rounded-control transition-colors text-gray-500 hover:bg-gray-100"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav — chỉ dùng cho các trang nền sáng */}
        {mobileOpen && !dark && (
          <div
            className={cn(
              'md:hidden border-t px-4 pb-4 pt-2 space-y-1',
              dark ? 'border-ink-700 bg-ink-900' : 'border-gray-100 bg-white',
            )}
          >
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <p
                    className={cn(
                      'px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                      dark ? 'text-ink-400' : 'text-gray-400',
                    )}
                  >
                    {link.label}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-control text-sm transition-colors',
                        dark ? 'text-ink-200 hover:text-white' : 'text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href!}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-control text-sm transition-colors',
                    dark ? 'text-ink-200 hover:text-white' : 'text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {link.label}
                </Link>
              ),
            )}
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <Link
                  to={dashboardHref}
                  className={cn(
                    'text-sm w-full text-center font-medium py-3 rounded-full transition-colors',
                    dark ? 'bg-white text-ink-900' : 'btn-primary justify-center',
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/dang-nhap"
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-colors',
                      dark ? 'border border-ink-600 text-white' : 'btn-secondary justify-center',
                    )}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/dang-ky"
                    className={cn(
                      'text-sm w-full text-center font-medium py-3 rounded-full transition-colors',
                      dark ? 'bg-white text-ink-900' : 'btn-primary justify-center',
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
        items={overlayLinks}
        actions={
          user
            ? [{ label: 'Dashboard', href: dashboardHref }]
            : [
                { label: 'Đăng nhập', href: '/dang-nhap' },
                { label: 'Đăng ký', href: '/dang-ky' },
              ]
        }
      />

      {/* Page content — mờ dần khi đổi route */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <FrozenOutlet />
            {/* Đứng sau FrozenOutlet: chạy khi trang mới đã dựng xong (kể cả pin của trang chủ) */}
            <RouteScroll />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          'border-t',
          dark ? 'bg-page-bg border-page-line' : 'bg-white border-gray-200 mt-16',
        )}
      >
        <div className={cn(dark ? 'shell py-section-sm' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className={cn(
                  'flex items-center gap-2 font-display font-semibold text-lg mb-3',
                  dark ? 'text-page-fg' : 'text-primary-600',
                )}
              >
                <Briefcase className="w-5 h-5" />
                Workmate
              </Link>
              <p className={cn('text-sm leading-relaxed', dark ? 'text-page-muted' : 'text-gray-500')}>
                Nền tảng kết nối việc làm linh hoạt dành cho sinh viên và người lao động.
              </p>
            </div>
            <div>
              <h4
                className={cn(
                  'text-xs font-medium uppercase tracking-[0.18em] mb-4',
                  dark ? 'text-page-muted' : 'text-gray-800',
                )}
              >Tìm việc</h4>
              <ul className={cn('space-y-3 text-sm', dark ? 'text-page-muted' : 'text-gray-500')}>
                <li><Link to="/viec-lam?type=part-time" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Part-time</Link></li>
                <li><Link to="/viec-lam?type=full-time" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Full-time</Link></li>
                <li><Link to="/viec-lam?nearMe=true" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Gần tôi</Link></li>
              </ul>
            </div>
            <div>
              <h4
                className={cn(
                  'text-xs font-medium uppercase tracking-[0.18em] mb-4',
                  dark ? 'text-page-muted' : 'text-gray-800',
                )}
              >Nhà tuyển dụng</h4>
              <ul className={cn('space-y-3 text-sm', dark ? 'text-page-muted' : 'text-gray-500')}>
                <li><Link to="/dang-ky" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Đăng tin miễn phí</Link></li>
                <li><Link to="/tuyen-dung" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Quản lý tuyển dụng</Link></li>
              </ul>
            </div>
            <div>
              <h4
                className={cn(
                  'text-xs font-medium uppercase tracking-[0.18em] mb-4',
                  dark ? 'text-page-muted' : 'text-gray-800',
                )}
              >Hỗ trợ</h4>
              <ul className={cn('space-y-3 text-sm', dark ? 'text-page-muted' : 'text-gray-500')}>
                <li><Link to="/cam-nang" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Cẩm nang nghề nghiệp</Link></li>
                <li><a href="mailto:support@workmate.vn" className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}>Liên hệ</a></li>
              </ul>
            </div>
          </div>
          <div
            className={cn(
              'mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs',
              dark ? 'border-page-line text-page-muted' : 'border-gray-100 text-gray-400',
            )}
          >
            <p>© 2026 Workmate. All rights reserved.</p>
            <a
              href="mailto:support@workmate.vn"
              className={cn('link-underline', dark ? 'hover:text-page-fg' : 'hover:text-primary-600')}
            >
              support@workmate.vn
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
