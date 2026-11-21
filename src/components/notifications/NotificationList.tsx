// Danh sách bên trong cửa sổ thông báo nổi.
import { useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, CalendarCheck, CalendarPlus, CalendarX, CheckCheck, Handshake, Heart, HeartHandshake, Hourglass, Sparkles, Star, Undo2, UserCheck, UserX, type LucideIcon } from 'lucide-react'
import { useMessengerStore } from '@context/messengerStore'
import ChatAvatar from '@pages/public/messages/ChatAvatar'
import { candidateHref } from '@pages/public/personal/links'
import { describeConversation } from '@pages/public/messages/describe'
import {
  markAllNotificationsRead, markNotificationRead, useNotifications,
  type DemoNotification, type Side,
} from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { formatRelativeTime } from '@utils/format'
import NotificationActionControl from './NotificationActionControl'
import type { NotificationEntry } from './notificationGroups'

const ICONS: Record<DemoNotification['kind'], LucideIcon> = {
  interest: Heart,
  considering: Hourglass,
  connected: Handshake,
  interview_invited: CalendarPlus,
  interview_confirmed: CalendarCheck,
  interview_declined: CalendarX,
  interview_cancelled: CalendarX,
  offer: BriefcaseBusiness,
  offer_accepted: UserCheck,
  offer_declined: UserX,
  offer_withdrawn: Undo2,
  rejected: HeartHandshake,
  review: Star,
  job_match: Sparkles,
  candidate_match: Sparkles,
}

/** Màu icon loại thông báo (góc avatar): tích cực = accent, từ chối/hủy = danger, còn lại = chữ thường */
const KIND_TONE: Partial<Record<DemoNotification['kind'], string>> = {
  connected: 'text-accent-ink', interview_confirmed: 'text-accent-ink', offer_accepted: 'text-accent-ink', offer: 'text-accent-ink', job_match: 'text-accent-ink', candidate_match: 'text-accent-ink',
  interview_declined: 'text-danger', interview_cancelled: 'text-danger', offer_declined: 'text-danger', offer_withdrawn: 'text-danger', rejected: 'text-danger',
}

const EVENTS: Record<DemoNotification['kind'], string> = {
  interest: 'Quan tâm hồ sơ của bạn', considering: 'Đang cân nhắc hồ sơ của bạn',
  connected: 'Hai bên đã kết nối', interview_invited: 'Có lời mời phỏng vấn',
  interview_confirmed: 'Đã xác nhận lịch phỏng vấn', interview_declined: 'Đã từ chối lời mời phỏng vấn',
  interview_cancelled: 'Đã hủy lịch phỏng vấn', offer: 'Có lời mời nhận việc',
  offer_accepted: 'Đã xác nhận nhận việc', offer_declined: 'Đã từ chối lời mời nhận việc',
  offer_withdrawn: 'Đã rút lời mời nhận việc', rejected: 'Lần này chưa phù hợp',
  review: 'Đã gửi đánh giá', job_match: 'Việc mới phù hợp với bạn', candidate_match: 'Ứng viên mới phù hợp',
}

const targetOf = (n: DemoNotification) => {
  switch (n.kind) {
    case 'review': return '/ca-nhan'
    case 'job_match': return `/viec-lam/${encodeURIComponent(n.jobId)}`
    case 'candidate_match': return candidateHref(n.seekerId)
    case 'interest': return '/match'
    case 'considering': case 'offer': case 'offer_withdrawn': case 'rejected': return '/tim-viec/ung-tuyen'
    case 'offer_accepted': case 'offer_declined': return '/tuyen-dung/match'
    default: return '/lich-phong-van'
  }
}

/** Nút "Đánh dấu tất cả là đã đọc" (tự tắt khi không còn thông báo chưa đọc) */
export function MarkAllReadButton({ viewer, className, compact }: { viewer: Side; className?: string; compact?: boolean }) {
  const items = useNotifications(viewer)
  const unread = items.filter((n) => !n.read).length
  return (
    <button
      type="button"
      aria-label={compact ? 'Đọc tất cả: đánh dấu toàn bộ thông báo là đã đọc' : undefined}
      title={compact ? 'Đánh dấu tất cả là đã đọc' : undefined}
      disabled={unread === 0}
      onClick={() => markAllNotificationsRead(viewer)}
      className={cn(BTN_SECONDARY, BTN_SM, className)}
    >
      {compact && <CheckCheck aria-hidden="true" className="h-4 w-4" />}
      {compact ? 'Đọc tất cả' : 'Đánh dấu tất cả là đã đọc'}
    </button>
  )
}

/** Mỗi thẻ giữ trạng thái đọc riêng; thao tác xử lý không phụ thuộc chấm chưa đọc. */
export default function NotificationList({ viewer, entries, onNavigate }: { viewer: Side; entries: NotificationEntry[]; onNavigate: () => void }) {
  const navigate = useNavigate()
  const openMessenger = useMessengerStore((s) => s.openMessenger)
  const open = (n: DemoNotification) => {
    if (!n.read) markNotificationRead(n.id)
    onNavigate()
    if (n.kind === 'connected') openMessenger(`${n.jobId}|${n.seekerId}`)
    else navigate(targetOf(n))
  }
  return (
    <ul className="space-y-3">
      {entries.map(({ notification: n, action }) => {
        const Icon = ICONS[n.kind]
        const info = describeConversation(viewer, n.jobId, n.seekerId)
        return (
          <li key={n.id} className={cn('overflow-hidden rounded-card border', n.read ? 'border-page-line bg-page-bg' : 'border-transparent bg-page-surface')}>
            <button type="button" onClick={() => open(n)} className={cn('group flex w-full items-start gap-3 rounded-card p-4 text-left transition-colors duration-fast hover:bg-wm-azure/5', FOCUS)}>
              <span className="relative mt-0.5 shrink-0">
                <ChatAvatar initials={info.initials} url={info.avatarUrl} contain={viewer === 'seeker'} className="h-11 w-11 text-sm" />
                <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-page-edge bg-page-bg">
                  <Icon className={cn('h-3.5 w-3.5', KIND_TONE[n.kind] ?? 'text-page-fg')} />
                </span>
              </span>
              <span className="min-w-0 flex-1 break-words">
                <span className="block text-sm font-semibold leading-6 text-page-fg">{info.name}</span>
                <span className="mt-0.5 block text-xs leading-5 text-page-muted">{info.subtitle}</span>
                <span className={cn('mt-2 block text-sm leading-6 text-page-fg', !n.read && 'font-medium')}>{viewer === 'recruiter' && n.kind === 'interest' ? 'Có hồ sơ ứng tuyển mới' : EVENTS[n.kind]}</span>
                <time dateTime={n.at} className="mt-2 block text-xs text-page-muted">{formatRelativeTime(n.at)}</time>
              </span>
              {!n.read && <><span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" /><span className="sr-only">Chưa đọc</span></>}
            </button>
            {action && <div className="notification-actions mx-4 border-t border-page-line py-3"><NotificationActionControl action={action} notification={n} onNavigate={onNavigate} /></div>}
          </li>
        )
      })}
    </ul>
  )
}
