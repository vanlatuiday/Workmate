import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Bell, CalendarCheck, CalendarPlus, CalendarX, Handshake, Heart, BriefcaseBusiness, UserCheck, UserX, Undo2, HeartHandshake, Star, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@components/dashboard'
import { useAuthStore } from '@context/authStore'
import {
  markAllNotificationsRead, markNotificationRead, useNotifications,
  type DemoNotification, type Side,
} from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'
import { describeConversation } from './messages/describe'

const ICONS: Record<DemoNotification['kind'], LucideIcon> = {
  interest: Heart,
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

/** Câu mô tả bằng tên thật của hai phía, theo người xem */
function sentence(viewer: Side, n: DemoNotification) {
  const { name, subtitle } = describeConversation(viewer, n.jobId, n.seekerId)
  switch (n.kind) {
    case 'interest':
      return viewer === 'seeker'
        ? `${name} đã quan tâm hồ sơ của bạn cho vị trí ${subtitle}`
        : `${name} đã quan tâm vị trí ${subtitle} của bạn`
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
    case 'connected': return `/tin-nhan?c=${n.jobId}|${n.seekerId}`
    case 'offer': case 'offer_withdrawn': case 'rejected': return '/tim-viec/ung-tuyen'
    case 'offer_accepted': case 'offer_declined': return '/tuyen-dung/match'
    default: return '/lich-phong-van'
  }
}

/** /thong-bao — danh sách thông báo của tài khoản demo (kho demo, chưa có backend). */
export default function NotificationsPage() {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return <Navigate to="/dang-nhap" state={{ from: '/thong-bao' }} />
  if (role === 'admin') {
    return (
      <section className="shell py-section-sm">
        <p className="max-w-xl font-display text-xl font-medium text-page-fg">Thông báo dành cho người tìm việc và nhà tuyển dụng.</p>
        <Link to="/admin" className={cn('mt-4 inline-block rounded-control text-sm underline underline-offset-4', FOCUS)}>
          Về khu quản trị
        </Link>
      </section>
    )
  }
  return <List viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function List({ viewer }: { viewer: Side }) {
  const items = useNotifications(viewer)
  const navigate = useNavigate()
  const today = new Date().toDateString()
  const groups = [
    { label: 'Hôm nay', list: items.filter((n) => new Date(n.at).toDateString() === today) },
    { label: 'Trước đó', list: items.filter((n) => new Date(n.at).toDateString() !== today) },
  ].filter((g) => g.list.length > 0)
  const unread = items.filter((n) => !n.read).length

  const open = (n: DemoNotification) => {
    markNotificationRead(n.id)
    navigate(targetOf(n))
  }

  return (
    <section className="shell py-section-sm" aria-labelledby="notif-title">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 id="notif-title" className="font-display text-display-sm font-semibold text-page-fg">Thông báo</h1>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => markAllNotificationsRead(viewer)}
            className={cn('rounded-full border border-page-line px-4 py-2 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg disabled:cursor-default disabled:text-page-muted disabled:hover:border-page-line', FOCUS)}
          >
            Đánh dấu đã đọc tất cả
          </button>
        </div>

        <div className="mt-8">
          {groups.length === 0 ? (
            <EmptyState icon={Bell} title="Chưa có thông báo" description="Khi có người quan tâm, kết nối hoặc hẹn phỏng vấn với bạn, thông báo sẽ hiện ở đây." />
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-8">
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-page-muted">{g.label}</h2>
                <ul className="border-t border-page-line">
                  {g.list.map((n) => {
                    const Icon = ICONS[n.kind]
                    return (
                      <li key={n.id} className="border-b border-page-line">
                        <button
                          type="button"
                          onClick={() => open(n)}
                          className={cn('flex w-full items-start gap-4 px-1 py-4 text-left transition-colors duration-300 hover:bg-page-surface', FOCUS)}
                        >
                          <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-page-edge text-page-fg">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block text-sm leading-relaxed text-page-fg', !n.read && 'font-semibold')}>{sentence(viewer, n)}</span>
                            <span className="mt-1 block text-xs text-page-muted">{formatRelativeTime(n.at)}</span>
                          </span>
                          {!n.read && (
                            <>
                              <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-page-fg" />
                              <span className="sr-only">Chưa đọc</span>
                            </>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
