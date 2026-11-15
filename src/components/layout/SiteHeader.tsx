import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { ROLE_AREAS } from '@constants/roles'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { useUnreadCount, useUnreadMessages } from '@services/connectionService'
import { useCurtainNavigate } from '@components/motion/PageCurtain'
import { PERSONAL_HREF } from '@pages/public/personal/links'
import { useHeaderScroll } from '@hooks/useHeaderScroll'
import { useHeaderPeek } from '@hooks/useHeaderPeek'
import AccountMenu from '@components/layout/AccountMenu'
import HeaderNav from '@components/layout/HeaderNav'
import Wordmark from '@components/layout/Wordmark'
import { NAV } from '@components/layout/navLinks'

type Props = {
  /** Trang chủ: header do useHomeHeader + IntroHero điều khiển (data-attribute), màu theo section */
  home: boolean
  /** Bề mặt phía dưới header (useHeaderSurface) — chỉ dùng ngoài trang chủ */
  surface: 'light' | 'dark'
  menuOpen: boolean
  menuId: string
  onOpenMenu: () => void
}

/**
 * Header công khai: cố định, cao 72px, trong suốt ở đầu trang.
 *   trái: chấm xanh + Workmate · giữa: menu trong viên kính · phải: Đăng nhập / tài khoản
 * Dưới 768px: chỉ còn logo + nút hamburger (mở MenuOverlay toàn màn hình).
 * Trang chủ giữ các data-attribute mà index.css / IntroHero / useHomeHeader dựa vào:
 *   data-site-header, data-brand-logo, data-header-item, data-header-menu, data-header-bg.
 */
export default function SiteHeader({ home, surface, menuOpen, menuId, onOpenMenu }: Props) {
  const { user, logout } = useAuthStore()
  const headerRef = useRef<HTMLElement>(null)
  // Trang chủ: useHomeHeader lo ẩn/hiện; ở đây chỉ co lại + nền khi cuộn
  useHeaderScroll(headerRef, !home)
  // Header đang ẩn: đưa chuột lên sát mép trên thì hiện lại (mọi trang, kể cả trang chủ)
  useHeaderPeek(headerRef)

  // Tin nhắn / thông báo chưa đọc (gọi hook luôn; admin không có hội thoại → 0)
  const unreadAsSeeker = useUnreadMessages()
  const unreadAsRecruiter = useUnreadMessages()
  const notifAsSeeker = useUnreadCount('seeker')
  const notifAsRecruiter = useUnreadCount('recruiter')
  const unreadNotifications = user?.role === 'jobseeker' ? notifAsSeeker : user?.role === 'recruiter' ? notifAsRecruiter : 0
  const unreadMessages = user?.role === 'jobseeker' ? unreadAsSeeker : user?.role === 'recruiter' ? unreadAsRecruiter : 0

  const area = user ? ROLE_AREAS[user.role] : null
  const navLinks = NAV[user?.role ?? 'guest']

  // Trang cá nhân: đã đăng nhập → mở bằng màn phủ từ trên xuống; khách → sang đăng nhập, xong quay lại
  const curtainGo = useCurtainNavigate()
  const navigate = useNavigate()
  const profileTo = user ? PERSONAL_HREF : '/dang-nhap'
  const openProfile = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (user) curtainGo(PERSONAL_HREF, 'Trang cá nhân', undefined, 'down')
    else navigate('/dang-nhap', { state: { from: PERSONAL_HREF } })
  }

  const item = home ? '' : undefined
  return (
    <header
      ref={headerRef}
      data-site-header=""
      data-tone={home ? undefined : surface}
      className={cn(
        'site-header fixed inset-x-0 top-0 z-40 h-[72px]',
        // Theme đặt biến --page-* cho viền focus, menu thả xuống…; trang chủ dùng biến của :root
        !home && (surface === 'dark' ? 'theme-night' : 'theme-ivory'),
      )}
    >
      <div className="hd-inner absolute inset-0">
        {/* Nền kính: ẩn ở đầu trang (trong suốt), hiện khi cuộn. Lớp ngoài do trang chủ ẩn khi còn ở banner */}
        <div data-header-bg={item} aria-hidden="true" className="pointer-events-none absolute inset-0">
        </div>

        <div className="hd-bar relative grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-x-4 px-6 md:px-10 lg:px-14">
          <Wordmark home={home} className="justify-self-start" />

          <div data-header-item={item} className="hidden lg:block">
            <HeaderNav links={navLinks} className="flex" />
          </div>

          <div className="col-start-3 flex items-center justify-end gap-3">
            <div data-header-item={item} className="hidden items-center gap-3 whitespace-nowrap lg:flex">
              {user && area ? (
                <AccountMenu
                  initial={user.email?.[0]?.toUpperCase() ?? 'U'}
                  area={{ label: area.label, href: area.home }}
                  profileHref={profileTo}
                  unreadMessages={unreadMessages}
                  unreadNotifications={unreadNotifications}
                  onOpenProfile={openProfile}
                  onLogout={logout}
                  magnetic={home}
                />
              ) : (
                <>
                  <Link to="/dang-ky" className={cn('hd-quiet rounded-control px-1 py-2', FOCUS)}>
                    Đăng ký
                  </Link>
                  <Link to="/dang-nhap" className={cn('hd-btn', FOCUS)}>
                    Đăng nhập
                    <span className="hd-btn__chip" aria-hidden="true">
                      <ArrowRight className="hd-btn__arrow h-3 w-3" strokeWidth={2.5} />
                    </span>
                  </Link>
                </>
              )}
            </div>

            {/* Dưới lg (1024px): hamburger 2 gạch — chữ menu 16px không đủ chỗ ở máy tính bảng dọc. Trang chủ: ở banner nút này hiện cả trên màn rộng (index.css → data-header-menu) */}
            <div data-header-item={item} data-header-menu={item} className="lg:hidden">
              <button
                type="button"
                onClick={onOpenMenu}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-haspopup="dialog"
                aria-label="Mở menu"
                className={cn('hd-burger', FOCUS)}
              >
                <i aria-hidden="true" />
                <i aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
