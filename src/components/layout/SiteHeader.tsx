import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, X } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useProfileStore } from '@context/profileStore'
import { useCompanyStore } from '@context/companyStore'
import AccountAvatar from './AccountAvatar'
import { ROLE_AREAS } from '@constants/roles'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { useUnreadCount, useUnreadMessages } from '@services/connectionService'
import { useCurtainNavigate } from '@components/motion/PageCurtain'
import { PERSONAL_HREF } from '@pages/public/personal/links'
import { useHeaderScroll } from '@hooks/useHeaderScroll'
import { useExperienceStore } from '@context/experienceStore'
import AccountActions from './AccountActions'
import { EXPLORE_ITEMS } from './ExploreMenu'
import AccountMenu from '@components/layout/AccountMenu'
import HeaderNav from '@components/layout/HeaderNav'
import Wordmark from '@components/layout/Wordmark'
import { NAV } from '@components/layout/navLinks'

type Props = {
  /** Trang chủ: header do useHomeHeader + IntroHero điều khiển (data-attribute), màu theo section */
  home: boolean
  /** Bề mặt phía dưới header (useHeaderSurface) — chỉ dùng ngoài trang chủ */
  surface: 'light' | 'dark' | 'day'
}

/**
 * Header công khai: cố định, cao 72px, trong suốt ở đầu trang.
 *   trái: chấm xanh + Workmate · giữa: menu trong viên kính · phải: Đăng nhập / tài khoản
 * Dưới 1024px: logo và nút hamburger mở menu điều hướng.
 * Trang chủ giữ các data-attribute mà index.css / IntroHero / useHomeHeader dựa vào:
 *   data-site-header, data-brand-logo, data-header-item, data-header-menu.
 * Ba cụm kính nổi (logo / menu / tài khoản) tự co lại khi cuộn xuống (useHeaderScroll); không có nền toàn chiều rộng.
 */
export default function SiteHeader({ home, surface }: Props) {
  const { user, logout } = useAuthStore()
  const avatarUrl = useProfileStore((s) => user?.role === 'jobseeker' ? s.avatarUrl : null)
  const logoUrl = useCompanyStore((s) => user?.role === 'recruiter' ? s.logoUrl : null)
  const accountAvatar = avatarUrl || logoUrl
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U'
  const headerRef = useRef<HTMLElement>(null)
  const compactMenuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [compactOpen, setCompactOpen] = useState(false)
  const menuId = useId()
  const { quality, setQuality } = useExperienceStore()
  const closeCompact = (refocus = true) => {
    setCompactOpen(false)
    if (refocus) triggerRef.current?.focus()
  }
  const homeTone = useHomeTone(home)
  // Thu nhỏ khi cuộn xuống / mở rộng khi cuộn lên, rê chuột, đổi route (mọi trang, kể cả trang chủ)
  const { pathname } = useLocation()
  useHeaderScroll(headerRef, pathname)

  useEffect(() => setCompactOpen(false), [pathname])

  useEffect(() => {
    if (!compactOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!compactMenuRef.current?.contains(event.target as Node)) setCompactOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [compactOpen])

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

  const actions = area ? {
    area: { label: area.label, href: area.home },
    profileHref: profileTo,
    unreadMessages,
    unreadNotifications,
    onOpenProfile: openProfile,
    onLogout: logout,
  } : null
  const row = cn('flex min-h-11 items-center justify-between rounded-control px-3 py-2 text-sm font-medium hover:bg-page-surface aria-[current=page]:bg-page-surface', FOCUS)
  const mobileLink = ({ href, label }: { href: string; label: string }) => (
    <Link key={href} to={href} className={row} aria-current={pathname === href ? 'page' : undefined} onClick={() => closeCompact(false)}>
      {label}
    </Link>
  )
  const guestLinks = (
    <>
      <Link to="/dang-ky" className={cn('hd-quiet rounded-control px-1 py-2', FOCUS)} onClick={() => closeCompact(false)}>
        Đăng ký
      </Link>
      <Link to="/dang-nhap" className={cn('hd-btn', FOCUS)} onClick={() => closeCompact(false)}>
        Đăng nhập
        <span className="hd-btn__chip" aria-hidden="true">
          <ArrowRight className="hd-btn__arrow h-3 w-3" strokeWidth={2.5} />
        </span>
      </Link>
    </>
  )

  const item = home ? '' : undefined
  return (
    <header
      ref={headerRef}
      data-site-header=""
      // Trang chủ: chỉ gắn 'light' khi khối đang xem là nền sáng (html[data-home-tone], useSectionThemes);
      // khối tối giữ màu theo biến --page-* như cũ
      data-tone={home ? (homeTone === 'light' ? 'light' : undefined) : surface === 'day' ? 'light' : surface}
      data-day={!home && surface === 'day' ? '' : undefined}
      className={cn(
        'site-header fixed inset-x-0 top-0 z-40 h-[72px]',
        // Theme đặt biến --page-* cho viền focus, menu thả xuống…; trang chủ dùng biến của :root
        !home && (surface === 'dark' ? 'theme-night' : surface === 'day' ? 'theme-day' : 'theme-ivory'),
      )}
    >
      <div className="hd-inner absolute inset-0">
        <div className="hd-bar relative grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-x-4 px-6 md:px-10 lg:px-14">
          {/* Viên kính riêng của logo (hiện khi cuộn); lề âm bù padding để logo không lệch chỗ */}
          <div className="hd-logo hd-cluster justify-self-start">
            <Wordmark home={home} />
          </div>

          <div data-header-item={item} className="hidden lg:block">
            <HeaderNav links={navLinks} className="hd-cluster hd-cluster-c flex" />
          </div>

          <div className="hd-cluster hd-cluster-r col-start-3 flex items-center justify-self-end gap-3">
            <div data-header-item={item} className="hidden items-center gap-3 whitespace-nowrap lg:flex">
              {user && actions ? (
                <AccountMenu {...actions} initial={initial} avatarUrl={accountAvatar} magnetic={home} />
              ) : guestLinks}
            </div>

            {/* Dưới lg (1024px): hamburger 2 gạch — chữ menu 16px không đủ chỗ ở máy tính bảng dọc. Trang chủ: ở banner nút này hiện cả trên màn rộng (index.css → data-header-menu) */}
            <div
              ref={compactMenuRef}
              data-header-item={item}
              data-header-menu={item}
              className="relative lg:hidden"
              onKeyDown={(event) => {
                if (compactOpen && event.key === 'Escape') {
                  event.preventDefault()
                  closeCompact()
                }
              }}
              onBlur={(event) => {
                if (compactOpen && !event.currentTarget.contains(event.relatedTarget)) closeCompact(false)
              }}
            >
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setCompactOpen((open) => !open)}
                aria-expanded={compactOpen}
                aria-controls={menuId}
                aria-label={compactOpen ? 'Đóng menu' : 'Mở menu'}
                className={cn('hd-burger', FOCUS)}
              >
                {compactOpen ? <X aria-hidden="true" className="h-5 w-5" /> : (
                  <>
                    <i aria-hidden="true" />
                    <i aria-hidden="true" />
                  </>
                )}
              </button>
              {compactOpen && (
                <nav
                  id={menuId}
                  aria-label="Menu chính"
                  className="hd-compact-menu absolute right-0 top-full mt-2 max-h-[calc(100dvh-5rem)] w-[min(19rem,calc(100vw-3rem))] overflow-y-auto overscroll-contain rounded-control border border-page-line bg-page-bg p-2 text-page-fg shadow-lg"
                >
                  {navLinks.map(mobileLink)}
                  <details className="group">
                    <summary className={cn(row, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}>
                      Khám phá
                      <ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" />
                    </summary>
                    <div className="pl-3">{EXPLORE_ITEMS.map(mobileLink)}</div>
                  </details>
                  <div className="my-1 border-t border-page-line" />
                  {actions ? (
                    <details className="group">
                      <summary className={cn(row, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}>
                        <span className="flex items-center gap-2">
                          <AccountAvatar initial={initial} url={accountAvatar} />
                          Trang cá nhân
                        </span>
                        <ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" />
                      </summary>
                      <div className="pl-3"><AccountActions {...actions} close={closeCompact} /></div>
                    </details>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3 px-3 py-2">{guestLinks}</div>
                      <button type="button" className={cn(row, 'w-full')} onClick={() => {
                        setQuality(quality === 'high' ? 'low' : 'high')
                        closeCompact()
                      }}>
                        {quality === 'high' ? 'Giảm hiệu ứng' : 'Nâng hiệu ứng'}
                        <span className="text-page-muted">{quality === 'high' ? 'Cao' : 'Thấp'}</span>
                      </button>
                    </>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

/** Tông khối trang chủ đang nằm dưới header (useSectionThemes ghi html[data-home-tone]) */
function useHomeTone(home: boolean): string | undefined {
  const [tone, setTone] = useState<string | undefined>(() => (home ? document.documentElement.dataset.homeTone : undefined))
  useEffect(() => {
    if (!home) return
    const html = document.documentElement
    const read = () => setTone(html.dataset.homeTone)
    read()
    const mo = new MutationObserver(read)
    mo.observe(html, { attributes: true, attributeFilter: ['data-home-tone'] })
    return () => mo.disconnect()
  }, [home])
  return home ? tone : undefined
}
