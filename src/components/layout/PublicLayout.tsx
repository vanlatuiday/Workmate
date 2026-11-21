import { Link, useLocation, useOutlet } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Briefcase } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useAuthStore } from '@context/authStore'
import { ROLE_AREAS } from '@constants/roles'
import { cn } from '@utils/cn'
import MenuOverlay from '@components/layout/MenuOverlay'
import { EXPLORE_ITEMS } from '@components/layout/ExploreMenu'
import SiteHeader from '@components/layout/SiteHeader'
import Wordmark from '@components/layout/Wordmark'
import { NAV } from '@components/layout/navLinks'
import RouteScroll from '@components/common/RouteScroll'
import PageCurtain from '@components/motion/PageCurtain'
import PageTransition from '@components/motion/PageTransition'
import { PERSONAL_HREF } from '@pages/public/personal/links'
import { FOCUS } from '@utils/focus'
import { useHeaderSurface } from '@hooks/useHeaderSurface'
import { isAuthPath } from '@pages/public/auth/authShared'
import DetailSkeleton from '@components/discover/detail/DetailSkeleton'
import DustField from '@components/motion/DustField'
import FadeIn from '@components/motion/FadeIn'
import DayBackdrop from '@components/layout/DayBackdrop'
import { DayContext, DAY_PATHS, NON_DAY_PATHS, matchesAny } from '@components/layout/dayContext'

/** Link nhỏ trong footer */
const FOOT_LINK = `link-underline rounded-control hover:text-page-fg ${FOCUS}`


/** Cột chân trang: trang ban ngày hiện dần khi cuộn tới (FadeIn), trang khác là div thường */
function Col({ day, delay, className, children }: { day: boolean; delay?: number; className?: string; children: ReactNode }) {
  return day ? <FadeIn day delay={delay} className={className}>{children}</FadeIn> : <div className={className}>{children}</div>
}

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

/**
 * Như FrozenOutlet nhưng cho nhóm Đăng nhập / Đăng ký / Quên mật khẩu: vẫn cập nhật khi
 * chuyển qua lại giữa 3 route (thẻ giữ nguyên, không remount), nhưng đứng yên từ lúc đường
 * dẫn rời nhóm — để hiệu ứng mờ đi vẫn thấy trang đăng nhập chứ không phải trang kế tiếp.
 * Đọc đường dẫn bằng useLocation (không qua props): bản cũ AnimatePresence giữ lại có props cũ.
 */
function AuthOutlet() {
  const outlet = useOutlet()
  const { pathname } = useLocation()
  // useOutlet() trả phần tử mới ở mỗi lần render nên không so sánh được → giữ bằng ref
  const last = useRef(outlet)
  if (isAuthPath(pathname)) last.current = outlet
  return last.current
}

/**
 * Trang công khai "ban ngày" (chủ dự án duyệt 2026-11-21): nền sáng xanh + DayBackdrop + chân trang abyss.
 * Danh sách đóng: trang chủ, đăng nhập, /ca-nhan, /ho-so, /tin-nhan… KHÔNG nằm ở đây (xem NON_DAY_PATHS).
 */
// DAY_PATHS / NON_DAY_PATHS / matchesAny: dayContext.ts (dùng chung với màn chuyển trang)

/** id của menu phủ — nút hamburger trong header trỏ tới bằng aria-controls */
const MENU_ID = 'site-menu'

export default function PublicLayout() {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()
  // Trang chủ dùng nền tối (page-* do useSectionThemes điều khiển); các trang còn lại dùng theme ngà.
  // `dark` phải đổi ngay khi đổi route: IntroHero tìm data-brand-logo… lúc mount.
  // Theme ngà gắn vào header, footer và khung của TỪNG trang (không gắn lên wrapper),
  // nên trang cũ đang mờ dần vẫn giữ màu của chính nó.
  const dark = location.pathname === '/'
  // Đăng nhập / Đăng ký / Quên mật khẩu: toàn màn hình — ẩn header và footer, chỉ giữ logo nhỏ để về trang chủ
  const bare = isAuthPath(location.pathname)
  // Câu chuyện của tôi (/ca-nhan): nền kem như mọi trang, nhưng cuối trang là footer tối có hạt bụi như trang chủ
  // Trang ban ngày (thay kiểu bìa xanh + nội dung tối 20/11 cho các trang này): nền DayBackdrop, chân trang abyss + đoạn hoàng hôn
  const day = !bare && (matchesAny(DAY_PATHS, location.pathname) || !matchesAny(NON_DAY_PATHS, location.pathname))
  const nightFooter = location.pathname === '/ca-nhan'
  // Trang chủ có header riêng (useHomeHeader). Trang khác: header tự sáng/tối theo khối đang nằm dưới nó
  // (khối đánh dấu data-surface="dark|light" — hook useHeaderSurface); không có khối đánh dấu thì ngà như cũ.
  const headerSurface = useHeaderSurface(!dark && !bare, day)
  // Đóng menu phủ khi chuyển trang
  useEffect(() => {
    setOverlayOpen(false)
  }, [location.pathname])

  // Đã đăng nhập: nút dẫn vào đúng khu làm việc của vai trò
  const area = user ? ROLE_AREAS[user.role] : null
  const dashboardHref = area?.home ?? '/tim-viec'
  const navLinks = NAV[user?.role ?? 'guest']
  const profileTo = user ? PERSONAL_HREF : '/dang-nhap'

  return (
    // Nền khung theo loại trang: trang chủ abyss, trang ban ngày day, trang ngà (cá nhân, tin nhắn…) ivory.
    // Header không còn nền (2026-11-21) nên dải 72px dưới header lộ màu khung — phải trùng màu trang, không thì thành vạch xanh.
    // Trang ban ngày: khung màu day (DayBackdrop nằm trên khung, dưới nội dung) nên chuyển giữa các trang ban ngày không chớp màu khác.
    <div className={cn('min-h-screen flex flex-col', bare ? 'bg-wm-night' : day ? 'bg-wm-day' : dark ? 'bg-wm-abyss' : 'bg-wm-ivory')}>
      {day && <DayBackdrop jobsPreview={location.pathname === '/viec-lam'} />}
      {bare ? (
        // Trang đăng nhập toàn màn hình: chỉ giữ logo (cùng kiểu header mới) để về trang chủ
        <div className="theme-night site-header absolute left-0 top-0 z-40 px-5 py-5 md:px-8" data-tone="dark">
          <Wordmark />
        </div>
      ) : (
        // Header cố định 72px (SiteHeader). Trang chủ: do IntroHero + useHomeHeader điều khiển qua data-attribute,
        // màu theo section; trang khác: tự sáng/tối theo khối nằm dưới (data-surface) và ẩn khi cuộn xuống.
        <SiteHeader home={dark} surface={headerSurface} menuOpen={overlayOpen} menuId={MENU_ID} onOpenMenu={() => setOverlayOpen(true)} />
      )}

      <MenuOverlay
        id={MENU_ID}
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        items={[...navLinks, ...EXPLORE_ITEMS, { label: 'Trang cá nhân', href: profileTo }]}
        actions={
          user
            ? [
                { label: 'Đăng xuất', onClick: logout },
                { label: area?.label ?? '', href: dashboardHref },
              ]
            : [
                { label: 'Đăng nhập', href: '/dang-nhap' },
                { label: 'Đăng ký', href: '/dang-ky' },
              ]
        }
      />

      {/* Page content — đổi route: trang cũ mờ đi nhanh, trang mới trượt từ trên xuống vào chỗ */}
      {/* pt-[72px]: header cố định không còn chiếm chỗ trong luồng. Trang chủ và trang đăng nhập (bare) tự nằm dưới header */}
      <main className={cn('relative flex-1', !dark && 'flex flex-col', !dark && !bare && 'pt-[72px]')}>
        <AnimatePresence mode="wait">
          {/* Trang đang mờ đi giữ nguyên className cũ (AnimatePresence giữ element cũ),
              nên theme ngà/tối của nó không bị đổi giữa chừng */}
          {/* 3 route đăng nhập chung một key 'auth' → chuyển qua lại không chạy hiệu ứng chuyển trang */}
          {/* Trang có bìa xanh + nội dung tối: khung trong suốt (lộ nền abyss của layout) thay vì nền ngà */}
          <PageTransition
            key={bare ? 'auth' : location.pathname}
            className={dark ? undefined : bare ? 'theme-night flex-1' : day ? 'theme-day flex-1' : 'theme-ivory flex-1'}
          >
            <DayContext.Provider value={day}>
            {/* Trang tải theo nhu cầu (lazy): Suspense nằm TRONG khung chuyển trang nên header/footer và
                trang cũ đang mờ đi không bị ảnh hưởng. RouteScroll cũng nằm trong Suspense → chỉ mount
                (và cuộn lên đầu / khôi phục vị trí) khi trang thật đã dựng xong, không cuộn lúc đang hiện khung chờ. */}
            {/* Khung chờ khi tải trang: trang tối / đăng nhập → khối trống (nền abyss liền mạch), trang ngà → khung xương */}
            <Suspense fallback={bare || day ? <div className="min-h-screen" /> : <DetailSkeleton />}>
              {bare ? <AuthOutlet /> : <FrozenOutlet />}
              {/* Đứng sau FrozenOutlet: chạy khi trang mới đã dựng xong (kể cả pin của trang chủ) */}
              <RouteScroll />
            </Suspense>
            </DayContext.Provider>
          </PageTransition>
        </AnimatePresence>
      </main>

      <PageCurtain />

      {/* Đoạn hoàng hôn: nền sáng tan dần vào abyss của chân trang (chỉ trang ban ngày) */}
      {day && <div aria-hidden="true" className="day-dusk pointer-events-none relative -mt-10 h-[190px]" />}

      {/* Footer (ẩn ở các trang đăng nhập toàn màn hình) */}
      {!bare && (
      <footer
        data-surface={nightFooter ? 'dark' : undefined}
        className={cn(
          'border-t bg-page-bg border-page-line',
          day ? 'theme-abyss relative overflow-hidden border-transparent' : nightFooter ? 'theme-night relative overflow-hidden' : !dark && 'theme-ivory',
        )}
      >
        {(nightFooter || day) && <DustField density="low" />}
        {/* relative z-10: chữ footer nằm trên lớp hạt của trang chủ (canvas z-[5]); nền footer
            không positioned nên vẫn nằm dưới hạt */}
        <div className="shell py-section-sm relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Col day={day} className="col-span-2 md:col-span-1">
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
            </Col>
            <Col day={day} delay={80}>
              <h4 className="text-sm font-medium mb-4 text-page-muted">Tìm việc</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/viec-lam?type=part-time" className={FOOT_LINK}>Bán thời gian</Link></li>
                <li><Link to="/viec-lam?type=full-time" className={FOOT_LINK}>Toàn thời gian</Link></li>
                <li><Link to="/viec-lam?nearMe=true" className={FOOT_LINK}>Gần tôi</Link></li>
              </ul>
            </Col>
            <Col day={day} delay={160}>
              <h4 className="text-sm font-medium mb-4 text-page-muted">Nhà tuyển dụng</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/nha-tuyen-dung" className={FOOT_LINK}>Dành cho nhà tuyển dụng</Link></li>
                <li><Link to="/dang-ky" className={FOOT_LINK}>Đăng tin miễn phí</Link></li>
                <li><Link to="/tuyen-dung" className={FOOT_LINK}>Quản lý tuyển dụng</Link></li>
              </ul>
            </Col>
            <Col day={day} delay={240}>
              <h4 className="text-sm font-medium mb-4 text-page-muted">Hỗ trợ</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                <li><Link to="/ho-tro" className={FOOT_LINK}>Câu hỏi thường gặp</Link></li>
                <li><Link to="/cam-nang" className={FOOT_LINK}>Cẩm nang</Link></li>
                <li><Link to="/lien-he" className={FOOT_LINK}>Liên hệ</Link></li>
              </ul>
            </Col>
          </div>
          <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-page-line text-page-muted">
            <p>© 2026 Workmate. Bảo lưu mọi quyền.</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <li><Link to="/gioi-thieu" className={FOOT_LINK}>Giới thiệu</Link></li>
              <li><Link to="/dieu-khoan" className={FOOT_LINK}>Điều khoản</Link></li>
              <li><Link to="/bao-mat" className={FOOT_LINK}>Bảo mật</Link></li>
            </ul>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
