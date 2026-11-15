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
 * Chấm xanh đập nhẹ như nhịp tim + chữ "Workmate" (chữ có chân 20px).
 * Cấu trúc (chấm 8px, khoảng cách 10px, chữ 20px/600) được ParticleField.sampleLogo dùng lại để vẽ logo intro.
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
      className={cn('hd-wordmark flex items-center gap-[10px] rounded-control font-serif text-[20px] font-semibold leading-7', FOCUS, className)}
    >
      <span className={cn('flex items-center gap-[10px]', home && 'animate-logo-in')}>
        <span aria-hidden="true" className="hd-dot" />
        Workmate
      </span>
    </Link>
  )
}
