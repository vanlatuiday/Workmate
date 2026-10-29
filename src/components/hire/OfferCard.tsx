import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { StatusBadge } from '@components/dashboard'
import { describeConversation } from '@pages/public/messages/describe'
import type { Hire } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'
import HireAction from './HireAction'
import { fmtDay } from './format'

/** Thẻ lời mời nhận việc của người tìm việc: việc, doanh nghiệp, ngày bắt đầu, lời nhắn và nút Xác nhận / Từ chối. */
export default function OfferCard({ hire }: { hire: Hire }) {
  const info = describeConversation('seeker', hire.jobId, hire.seekerId)
  return (
    <li className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to={`/viec-lam/${hire.jobId}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
            {info.subtitle}
          </Link>
          <StatusBadge tone="strong">Lời mời nhận việc</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-page-muted">{info.name} · gửi {formatRelativeTime(hire.at)}</p>
        {hire.startDate && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-page-fg">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            Bắt đầu từ {fmtDay(hire.startDate)}
          </p>
        )}
        {hire.note && <p className="mt-1 max-w-xl text-sm leading-relaxed text-page-muted">“{hire.note}”</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
        <HireAction viewer="seeker" jobId={hire.jobId} seekerId={hire.seekerId} compact />
      </div>
    </li>
  )
}
