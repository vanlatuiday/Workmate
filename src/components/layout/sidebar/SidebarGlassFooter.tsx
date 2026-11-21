import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { PRESS } from '@utils/ui'
import calendarArt from '@assets/images/home/hero-art-calendar.webp'

type Props = {
  collapsed: boolean
  onNavigate?: () => void
  tip: (label: string) => Record<string, unknown>
}

const FADE = 'transition-[opacity,visibility] duration-200 motion-reduce:transition-none'

/**
 * Chân thanh bên bản kính xanh (dashboard người tìm việc, 2026-11-21): thẻ mời cập nhật lịch rảnh + Đăng xuất.
 * Thay SidebarUser; tên/email người dùng đã có ở menu tài khoản trên header. Thu gọn: ẩn thẻ, Đăng xuất còn icon.
 */
export default function SidebarGlassFooter({ collapsed, onNavigate, tip }: Props) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  return (
    <div className="flex-shrink-0 p-3">
      <div
        aria-hidden={collapsed}
        className={cn(
          'jd-promo mb-3 rounded-card border border-page-line px-4 pb-4 pt-3 text-center',
          'transition-[opacity,visibility,max-height] duration-200 motion-reduce:transition-none',
          collapsed ? 'invisible max-h-0 overflow-hidden border-transparent py-0 opacity-0' : 'visible max-h-72 opacity-100 delay-150',
        )}
      >
        <img src={calendarArt} alt="" width={96} height={96} loading="lazy" className="mx-auto h-20 w-20 select-none object-contain" />
        <p className="mt-1 font-display text-sm font-semibold text-page-fg">Cập nhật lịch rảnh</p>
        <p className="mt-0.5 text-xs text-page-muted">để nhận việc phù hợp hơn!</p>
        <Link
          to="/ho-so#lich-ranh"
          tabIndex={collapsed ? -1 : 0}
          onClick={onNavigate}
          className={cn(
            'mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-wm-azure px-4 py-1.5 text-xs font-medium text-wm-ivory hover:brightness-110',
            PRESS,
            FOCUS,
          )}
        >
          Cập nhật ngay <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          logout()
          navigate('/dang-nhap')
        }}
        {...tip('Đăng xuất')}
        className={cn(
          'flex h-10 w-full items-center rounded-[14px] pl-[15px] pr-3 text-sm font-medium text-page-muted transition-colors duration-fast hover:bg-wm-ivory/10 hover:text-page-fg motion-reduce:transition-none',
          FOCUS,
        )}
      >
        <LogOut className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        <span className={cn('ml-3 truncate', FADE, collapsed ? 'invisible opacity-0' : 'visible opacity-100 delay-150')}>Đăng xuất</span>
      </button>
    </div>
  )
}
