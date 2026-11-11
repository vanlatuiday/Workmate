// Danh sách thông báo dùng chung cho trang /thong-bao và popup thông báo nổi.
import { useNavigate } from 'react-router-dom'
import { Bell, BriefcaseBusiness, CalendarCheck, CalendarPlus, CalendarX, Handshake, Heart, HeartHandshake, Hourglass, Star, Undo2, UserCheck, UserX, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@components/dashboard'
import { useMessengerStore } from '@context/messengerStore'
import ChatAvatar from '@pages/public/messages/ChatAvatar'
import { describeConversation } from '@pages/public/messages/describe'
import {
  markAllNotificationsRead, markNotificationRead, useNotifications,
  type DemoNotification, type Side,
} from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'

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
}

/** Màu icon loại thông báo (góc avatar): tích cực = accent, từ chối/hủy = danger, còn lại = chữ thường */
const KIND_TONE: Partial<Record<DemoNotification['kind'], string>> = {
  connected: 'text-accent-ink', interview_confirmed: 'text-accent-ink', offer_accepted: 'text-accent-ink', offer: 'text-accent-ink',
  interview_declined: 'text-danger', interview_cancelled: 'text-danger', offer_declined: 'text-danger', offer_withdrawn: 'text-danger', rejected: 'text-danger',
}

/** Câu mô tả bằng tên thật của hai phía, theo người xem */
function sentence(viewer: Side, n: DemoNotification) {
  const { name, subtitle } = describeConversation(viewer, n.jobId, n.seekerId)
  switch (n.kind) {
    case 'interest':
      return viewer === 'seeker'
        ? `${name} đã quan tâm hồ sơ của bạn cho vị trí ${subtitle}`
        : `${name} đã quan tâm vị trí ${subtitle} của bạn`
    case 'considering':
      return `${name} đang cân nhắc hồ sơ của bạn cho vị trí ${subtitle}`
    case 'connected':
      return `Bạn và ${name} đã kết nối · vị trí ${subtitle}`
    case 'interview_invited':
      return `${name} mời bạn phỏng vấn vị trí ${subtitle}`
    case 'interview_confirmed':
      return `${name} đã xác nhận phỏng vấn vị trí ${subtitle}`
    case 'interview_declined':
      return `${name} đã từ chối lời mời phỏng vấn vị trí ${subtitle}`
    case 'interview_cancelled':
      return `${name} đã hủy lịch phỏng vấn vị trí ${subtitle}`
    case 'offer':
      return `${name} mời bạn nhận việc vị trí ${subtitle}. Hãy xem và xác nhận đi làm nhé`
    case 'offer_accepted':
      return `${name} đã xác nhận đi làm vị trí ${subtitle}`
    case 'offer_declined':
      return `${name} đã từ chối lời mời nhận việc vị trí ${subtitle}`
    case 'offer_withdrawn':
      return `${name} đã rút lời mời nhận việc vị trí ${subtitle}`
    case 'review':
      return `${name} vừa gửi đánh giá sau khi làm việc cùng bạn (vị trí ${subtitle})`
    case 'rejected':
      return `${name} cảm ơn bạn đã quan tâm vị trí ${subtitle}, lần này chưa phù hợp. Chúc bạn sớm tìm được việc ưng ý`
  }
}

const targetOf = (n: DemoNotification) => {
  switch (n.kind) {
    case 'review': return '/ca-nhan'
    case 'interest': return '/match'
    case 'considering': case 'offer': case 'offer_withdrawn': case 'rejected': return '/tim-viec/ung-tuyen'
    case 'offer_accepted': case 'offer_declined': return '/tuyen-dung/match'
    default: return '/lich-phong-van'
  }
}

/** Nút "Đánh dấu đã đọc tất cả" (tự tắt khi không còn thông báo chưa đọc) */
export function MarkAllReadButton({ viewer, className }: { viewer: Side; className?: string }) {
  const items = useNotifications(viewer)
  const unread = items.filter((n) => !n.read).length
  return (
    <button
      type="button"
      disabled={unread === 0}
      onClick={() => markAllNotificationsRead(viewer)}
      className={cn('rounded-full border border-page-line px-4 py-2 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg hover:bg-page-surface disabled:cursor-default disabled:text-page-muted disabled:hover:border-page-line disabled:hover:bg-transparent', FOCUS, className)}
    >
      Đánh dấu đã đọc tất cả
    </button>
  )
}

/** Danh sách thông báo chia nhóm Mới (chưa đọc) / Trước đó. `onNavigate`: gọi sau khi bấm một thông báo (popup dùng để tự đóng). */
export default function NotificationList({ viewer, onNavigate, compact }: { viewer: Side; onNavigate?: () => void; compact?: boolean }) {
  const items = useNotifications(viewer)
  const navigate = useNavigate()
  const openMessenger = useMessengerStore((s) => s.openMessenger)
  // Trong popup tiêu đề popup đã là h2 → tiêu đề nhóm là h3; trang /thong-bao giữ h2
  const Heading = compact ? 'h3' : 'h2'
  const groups = [
    { label: 'Mới', list: items.filter((n) => !n.read) },
    { label: 'Trước đó', list: items.filter((n) => n.read) },
  ].filter((g) => g.list.length > 0)

  const open = (n: DemoNotification) => {
    markNotificationRead(n.id)
    onNavigate?.()
    // Thông báo "đã kết nối" mở thẳng khung tin nhắn nổi tại hội thoại đó
    if (n.kind === 'connected') openMessenger(`${n.jobId}|${n.seekerId}`)
    else navigate(targetOf(n))
  }

  if (groups.length === 0) {
    return <EmptyState icon={Bell} title="Chưa có thông báo" description="Khi có người quan tâm, kết nối hoặc hẹn phỏng vấn với bạn, thông báo sẽ hiện ở đây." />
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.label} className={compact ? 'mb-5 last:mb-0' : 'mb-8'}>
          <Heading className="mb-2 px-1 text-xs font-medium text-page-muted">{g.label}</Heading>
          <ul className="space-y-1">
            {g.list.map((n) => {
              const Icon = ICONS[n.kind]
              const info = describeConversation(viewer, n.jobId, n.seekerId)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    // Chưa đọc: nền đậm hơn + chấm; đã đọc: trong suốt. Hover = viền (không trùng nền chưa đọc)
                    className={cn(
                      'group flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors duration-300',
                      n.read ? 'border-transparent bg-transparent' : 'border-transparent bg-page-surface',
                      'hover:border-page-edge',
                      FOCUS,
                    )}
                  >
                    <span className="relative mt-0.5 shrink-0">
                      <ChatAvatar initials={info.initials} url={info.avatarUrl} contain={viewer === 'seeker'} className="h-10 w-10 text-sm" />
                      <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-page-edge bg-page-bg">
                        <Icon className={cn('h-3 w-3', KIND_TONE[n.kind] ?? 'text-page-fg')} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm leading-relaxed text-page-fg group-hover:underline group-hover:underline-offset-4', !n.read && 'font-semibold')}>{sentence(viewer, n)}</span>
                      <span className="mt-1 block text-xs text-page-muted">{formatRelativeTime(n.at)}</span>
                    </span>
                    {!n.read && (
                      <>
                        <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                        <span className="sr-only">Chưa đọc</span>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </>
  )
}
