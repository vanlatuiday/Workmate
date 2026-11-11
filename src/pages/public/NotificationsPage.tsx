import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import type { Side } from '@services/connectionService'
import NotificationList, { MarkAllReadButton } from '@components/notifications/NotificationList'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

/** /thong-bao — danh sách thông báo của tài khoản đang đăng nhập. */
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
  return (
    <section className="shell py-section-sm" aria-labelledby="notif-title">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 id="notif-title" className="font-display text-display-sm font-semibold text-page-fg">Thông báo</h1>
          <MarkAllReadButton viewer={viewer} />
        </div>

        <div className="mt-8">
          <NotificationList viewer={viewer} />
        </div>
      </div>
    </section>
  )
}
