import { Link, useLocation } from 'react-router-dom'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { scrollToHomeBanner } from '@components/home/IntroHero'

type Props = {
  /** Trang chủ: logo do IntroHero điều khiển (data-brand-logo) và hiện dần riêng */
  home?: boolean
  className?: string
}

/**
 * Biểu tượng và chữ Workmate. Màu chữ đi theo tông sáng/tối của header.
 */
export default function Wordmark({ home = false, className }: Props) {
  const { pathname } = useLocation()
  return (
    <Link
      to="/"
      // Đang ở trang chủ: cuộn mượt về banner thay vì tải lại trang
      onClick={(e) => {
        if (pathname === '/' && scrollToHomeBanner()) e.preventDefault()
      }}
      data-brand-logo={home ? '' : undefined}
      className={cn('hd-wordmark flex items-center gap-2 rounded-control font-display text-xl font-semibold tracking-tight', FOCUS, className)}
    >
      <span className={cn('flex items-center gap-2', home && 'animate-logo-in')}>
        <img src="/workmate-mark.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
        Workmate
      </span>
    </Link>
  )
}
