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
  /** Bật hiệu ứng tương tác (chỉ có tác dụng khi thẻ là link): nhấc 2px, viền đậm một bậc; số > 0 lên màu nhấn vai trò */
  lively?: boolean
}


/** Ô số liệu tổng quan (số lớn + nhãn). Dùng trong lưới ở trang Tổng quan. */
export default function StatCard({ label, value, icon: Icon, href, hint, emptyAction, lively }: Props) {
  const showEmpty = !!emptyAction && (value === 0 || value === '0')
  const className = cn(
    'dash-card block p-5 md:p-6',
    href && !showEmpty && cn('transition-colors duration-fast hover:bg-wm-ivory/80', FOCUS),
    // Chỉ thẻ là link mới nhấc lên; giảm chuyển động → chỉ đổi viền, không dời
    href && !showEmpty && lively && 'transition-[transform,background-color,border-color] duration-base ease-out hover:-translate-y-0.5 hover:border-wm-charcoal/25 focus-visible:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0',
  )
  const lit = lively && !showEmpty && typeof value === 'number' && value > 0
  const body = (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-page-muted">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      </div>
      <p className={cn('tnum mt-3 font-display text-3xl font-medium md:text-4xl', lit ? 'text-accent-ink' : 'text-page-fg')}>{value}</p>
      {showEmpty && emptyAction ? (
        <p className="mt-2 text-xs text-page-muted">
          {emptyAction.text} ·{' '}
          <Link
            to={emptyAction.href}
            className={cn('rounded-control font-medium text-page-fg underline underline-offset-4 transition-colors duration-fast hover:text-accent-ink', FOCUS)}
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
