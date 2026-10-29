import { Link } from 'react-router-dom'
import { Users, Building2, FileText, Handshake, ChevronRight } from 'lucide-react'
import { PageHeader, Panel, StatCard, StatusBadge, MockNotice } from '@components/dashboard'
import { useDemoStore } from '@context/demoStore'
import { COMPANIES } from '@pages/public/jobs/data'
import { DEMO_COMPANY } from '@pages/public/match/data'
import { useAdmin, useAdminJobs } from '@services/adminService'
import { mockUsers, newUsersPerDay, overviewStats, ROLE_LABELS } from './mockData'
import { FOCUS } from '@utils/focus'


const maxNew = Math.max(...newUsersPerDay.map((d) => d.count))
const totalNew = newUsersPerDay.reduce((s, d) => s + d.count, 0)
const chartSummary =
  `Người dùng mới 7 ngày gần nhất, tổng ${totalNew}. ` +
  newUsersPerDay.map((d) => `${d.date}: ${d.count}`).join('; ')

// Dữ liệu mẫu — thay bằng API
const recentSignups = mockUsers.slice(0, 5)

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const COMPANY_IDS = [...COMPANIES.map((c) => c.id), DEMO_COMPANY.id]

export default function AdminDashboard() {
  const s = overviewStats
  // Số liệu thật từ kho quản trị + kho kết nối (người dùng và đăng ký mới vẫn là mẫu)
  const jobRows = useAdminJobs()
  const reports = useAdmin((st) => st.reports)
  const verified = useAdmin((st) => st.verifiedCompanies)
  const connections = useDemoStore((st) => st.connections)
  const pendingJobs = jobRows.filter((r) => r.status === 'pending')
  const flaggedPending = pendingJobs.filter((r) => r.flags.length).length
  const openReports = reports.filter((r) => r.status === 'open').length
  const unverified = COMPANY_IDS.filter((id) => !verified[id]).length
  const weekMatches = connections.filter((c) => Date.now() - +new Date(c.at) <= WEEK_MS).length
  const todoItems = [
    { id: 't1', label: `${unverified} nhà tuyển dụng chưa xác minh`, detail: 'Xem hồ sơ và gắn nhãn xác minh', href: '/admin/xac-minh', n: unverified },
    { id: 't2', label: `${openReports} báo cáo đang mở`, detail: 'Báo cáo tin hoặc ứng viên cần xem xét', href: '/admin/bao-cao', n: openReports },
    { id: 't3', label: `${pendingJobs.length} tin chờ kiểm duyệt`, detail: flaggedPending ? `${flaggedPending} tin bị gắn cờ cảnh báo` : 'Chưa có tin nào bị gắn cờ', href: '/admin/kiem-duyet', n: pendingJobs.length },
  ].filter((t) => t.n > 0)
  return (
    <div>
      <PageHeader title="Tổng quan" description="Tình hình hệ thống Workmate và những việc cần xử lý hôm nay." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Người dùng" value={s.totalUsers.toLocaleString('vi-VN')} icon={Users} hint={s.usersHint} />
        <StatCard label="NTD chưa xác minh" value={unverified} icon={Building2} href="/admin/xac-minh" hint="Công ty chưa có nhãn xác minh" />
        <StatCard label="Tin chờ kiểm duyệt" value={pendingJobs.length} icon={FileText} href="/admin/kiem-duyet" hint={`${flaggedPending} tin bị gắn cờ`} />
        <StatCard label="Kết nối 7 ngày qua" value={weekMatches} icon={Handshake} hint={`${openReports} báo cáo đang mở`} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Việc cần xử lý">
          {todoItems.length === 0 && <p className="py-3 text-sm text-page-muted">Không có việc nào cần xử lý.</p>}
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
