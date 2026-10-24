import { Link } from 'react-router-dom'
import { Users, Building2, FileText, Handshake, ChevronRight } from 'lucide-react'
import { PageHeader, Panel, StatCard, StatusBadge, MockNotice } from '@components/dashboard'
import { mockUsers, newUsersPerDay, overviewStats, ROLE_LABELS, todoItems } from './mockData'
import { FOCUS } from '@utils/focus'


const maxNew = Math.max(...newUsersPerDay.map((d) => d.count))
const totalNew = newUsersPerDay.reduce((s, d) => s + d.count, 0)
const chartSummary =
  `Người dùng mới 7 ngày gần nhất, tổng ${totalNew}. ` +
  newUsersPerDay.map((d) => `${d.date}: ${d.count}`).join('; ')

// Dữ liệu mẫu — thay bằng API
const recentSignups = mockUsers.slice(0, 5)

export default function AdminDashboard() {
  const s = overviewStats
  return (
    <div>
      <PageHeader title="Tổng quan" description="Tình hình hệ thống Workmate và những việc cần xử lý hôm nay." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Người dùng" value={s.totalUsers.toLocaleString('vi-VN')} icon={Users} hint={s.usersHint} />
        <StatCard label="NTD chờ xác minh" value={s.pendingVerifications} icon={Building2} href="/admin/xac-minh" hint={s.verificationHint} />
        <StatCard label="Tin chờ kiểm duyệt" value={s.pendingModeration} icon={FileText} href="/admin/kiem-duyet" hint={s.moderationHint} />
        <StatCard label="MATCH trong tuần" value={s.weeklyMatches} icon={Handshake} hint={s.matchHint} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Việc cần xử lý">
          <ul className="divide-y divide-page-line">
            {todoItems.map((t) => (
              <li key={t.id}>
                <Link
                  to={t.href}
                  className={`group flex items-center justify-between gap-3 py-3 rounded-control ${FOCUS}`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-page-fg">{t.label}</span>
                    <span className="block text-xs text-page-muted">{t.detail}</span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 flex-shrink-0 text-page-muted transition-colors duration-300 group-hover:text-page-fg"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Đăng ký mới" action={<Link to="/admin/nguoi-dung" className={`text-page-muted underline underline-offset-4 hover:text-page-fg rounded-control ${FOCUS}`}>Xem tất cả</Link>}>
          <ul className="divide-y divide-page-line">
            {recentSignups.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-page-fg">{u.name}</p>
                  <p className="text-xs text-page-muted">{u.joinedAt}</p>
                </div>
                <StatusBadge tone="muted">{ROLE_LABELS[u.role]}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Người dùng mới 7 ngày" className="mt-6">
        <div role="img" aria-label={chartSummary} className="flex h-48 items-end gap-2 sm:gap-4">
          {newUsersPerDay.map((d) => (
            <div key={d.date} aria-hidden="true" className="flex h-full flex-1 flex-col justify-end items-center gap-2">
              <span className="tnum text-xs text-page-fg">{d.count}</span>
              <div className="w-full max-w-12 rounded-t-control bg-page-fg" style={{ height: `${(d.count / maxNew) * 80}%` }} />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-2 sm:gap-4 border-t border-page-line pt-2">
          {newUsersPerDay.map((d) => (
            <div key={d.date} className="flex-1 text-center text-xs text-page-muted">
              <span className="block">{d.day}</span>
              <span className="hidden sm:block">{d.date}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6">
        <MockNotice />
      </div>
    </div>
  )
}
