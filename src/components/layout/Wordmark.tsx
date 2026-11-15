import { Link, useLocation } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { scrollToHomeBanner } from '@components/home/IntroHero'

type Props = {
  /** Trang chủ: logo do IntroHero điều khiển (data-brand-logo) và hiện dần riêng */
  home?: boolean
  className?: string
}

/**
 * Logo Workmate (chủ dự án giữ logo cũ, 2026-11-15): icon cặp 20px + chữ "Workmate" 20px/600, cách 8px.
 * Đúng kích thước này mà ParticleField.sampleLogo vẽ logo hạt ở màn mở đầu trang chủ — đổi thì đổi cả hai.
 * Không nền, không viền: "chìm" vào nền phía sau.
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
        <Briefcase className="h-5 w-5" aria-hidden="true" />
        Workmate
      </span>
    </Link>
  )
}
