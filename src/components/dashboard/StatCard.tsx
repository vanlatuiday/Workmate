import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'

type Props = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Có href thì cả thẻ là link */
  href?: string
  hint?: string
}

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'

/** Ô số liệu tổng quan (số lớn + nhãn). Dùng trong lưới ở trang Tổng quan. */
export default function StatCard({ label, value, icon: Icon, href, hint }: Props) {
  const className = cn(
    'block rounded-card border border-page-line bg-page-surface p-5 md:p-6',
    href && cn('transition-colors duration-300 hover:border-page-fg', FOCUS),
  )
  const body = (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-page-muted">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      </div>
      <p className="tnum mt-3 font-display text-3xl md:text-4xl font-medium text-page-fg">{value}</p>
      {hint && <p className="mt-2 text-xs text-page-muted">{hint}</p>}
    </>
  )
  return href ? (
    <Link to={href} className={className}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
