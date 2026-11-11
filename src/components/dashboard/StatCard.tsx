import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Props = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Có href thì cả thẻ là link */
  href?: string
  hint?: string
  /** Khi value bằng 0: thay hint bằng gợi ý + link hành động, vd. "Chưa lưu việc nào · Khám phá việc làm →".
   *  Lúc này thẻ không còn là link toàn thẻ (tránh lồng link trong link) — chỉ link gợi ý bấm được. */
  emptyAction?: { text: string; label: string; href: string }
}


/** Ô số liệu tổng quan (số lớn + nhãn). Dùng trong lưới ở trang Tổng quan. */
export default function StatCard({ label, value, icon: Icon, href, hint, emptyAction }: Props) {
  const showEmpty = !!emptyAction && (value === 0 || value === '0')
  const className = cn(
    'block rounded-card border border-page-line bg-page-surface p-5 md:p-6',
    href && !showEmpty && cn('transition-colors duration-300 hover:border-page-fg hover:bg-page-line', FOCUS),
  )
  const body = (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-page-muted">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      </div>
      <p className="tnum mt-3 font-display text-3xl md:text-4xl font-medium text-page-fg">{value}</p>
      {showEmpty && emptyAction ? (
        <p className="mt-2 text-xs text-page-muted">
          {emptyAction.text} ·{' '}
          <Link
            to={emptyAction.href}
            className={cn('rounded-control font-medium text-page-fg underline underline-offset-4 transition-colors duration-300 hover:text-accent-ink', FOCUS)}
          >
            {emptyAction.label}&nbsp;<span aria-hidden="true">→</span>
          </Link>
        </p>
      ) : (
        hint && <p className="mt-2 text-xs text-page-muted">{hint}</p>
      )}
    </>
  )
  return href && !showEmpty ? (
    <Link to={href} className={className}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
