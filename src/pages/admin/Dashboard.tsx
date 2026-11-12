import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, FileText, Handshake, ChevronRight } from 'lucide-react'
import { PageHeader, Panel, SkeletonList, StatCard, StatusBadge } from '@components/dashboard'
import { useConnectionStore } from '@context/connectionStore'
import { fetchVerifications, useAdmin, useAdminJobs, useCompanyFlags, useSignupsPerDay } from '@services/adminService'
import { ROLE_LABELS } from './mockData'
import FadeIn from '@components/motion/FadeIn'
import { FOCUS } from '@utils/focus'


const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function AdminDashboard() {
  const users = useAdmin((st) => st.users)
  const recentSignups = users.slice(0, 5)
  const seekerCount = users.filter((u) => u.role === 'jobseeker').length
  const recruiterCount = users.filter((u) => u.role === 'recruiter').length
  const newUsersPerDay = useSignupsPerDay(7)
  const maxNew = Math.max(1, ...newUsersPerDay.map((d) => d.count))
  const totalNew = newUsersPerDay.reduce((n, d) => n + d.count, 0)
  const chartSummary = `Người dùng mới 7 ngày gần nhất, tổng ${totalNew}. ${newUsersPerDay.map((d) => `${d.date}: ${d.count}`).join('; ')}`
  const jobRows = useAdminJobs()
  const reports = useAdmin((st) => st.reports)
  const { verified } = useCompanyFlags()
  const connections = useConnectionStore((st) => st.connections)
  const pendingJobs = jobRows.filter((r) => r.status === 'pending')
  // Cùng điều kiện với tab "Bị gắn cờ" ở trang Kiểm duyệt: tin đang hiện (đã duyệt) có cờ cảnh báo
  const flaggedLive = jobRows.filter((r) => r.status === 'approved' && r.flags.length > 0).length
  const openReports = reports.filter((r) => r.status === 'open').length
  // Yêu cầu xác minh có giấy tờ đang chờ duyệt
  const [pendingVerif, setPendingVerif] = useState(0)
  const [verifLoaded, setVerifLoaded] = useState(false)
  useEffect(() => { void fetchVerifications('pending').then((r) => { setPendingVerif(r.data.length); setVerifLoaded(true) }) }, [])
  const unverified = Object.values(verified).filter((v) => !v).length
  const weekMatches = connections.filter((c) => Date.now() - +new Date(c.at) <= WEEK_MS).length
  const todoItems = [
    { id: 't0', label: `${pendingVerif} yêu cầu xác minh chờ duyệt`, detail: 'Xem giấy tờ doanh nghiệp đã gửi', href: '/admin/xac-minh', n: pendingVerif },
    { id: 't1', label: `${unverified} nhà tuyển dụng chưa xác minh`, detail: 'Xem hồ sơ và gắn nhãn xác minh', href: '/admin/xac-minh', n: unverified },
    { id: 't2', label: `${openReports} báo cáo đang mở`, detail: 'Báo cáo tin hoặc ứng viên cần xem xét', href: '/admin/bao-cao', n: openReports },
    { id: 't3', label: `${pendingJobs.length} tin chờ kiểm duyệt`, detail: flaggedLive ? `${flaggedLive} tin đang hiện bị gắn cờ cảnh báo` : 'Chưa có tin nào bị gắn cờ', href: '/admin/kiem-duyet', n: pendingJobs.length },
  ].filter((t) => t.n > 0)
  return (
    <div>
      <PageHeader title="Tổng quan" description="Tình hình hệ thống Workmate và những việc cần xử lý hôm nay." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Người dùng" value={users.length.toLocaleString('vi-VN')} icon={Users} hint={`${seekerCount} người tìm việc, ${recruiterCount} nhà tuyển dụng`} />
        <StatCard label="NTD chưa xác minh" value={unverified} icon={Building2} href="/admin/xac-minh" hint="Công ty chưa có nhãn xác minh" />
        <StatCard label="Tin chờ kiểm duyệt" value={pendingJobs.length} icon={FileText} href="/admin/kiem-duyet" hint={`${flaggedLive} tin đang hiện bị gắn cờ`} />
        <StatCard label="Kết nối 7 ngày qua" value={weekMatches} icon={Handshake} hint="Hai bên cùng quan tâm" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn className="[&>section]:h-full">
        <Panel title="Việc cần xử lý">
          {!verifLoaded && <SkeletonList rows={3} label="Đang tải việc cần xử lý…" />}
          {verifLoaded && todoItems.length === 0 && <p className="py-3 text-sm text-page-muted">Không có việc nào cần xử lý.</p>}
          {verifLoaded && <ul className="divide-y divide-page-line">
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
                    className="h-4 w-4 flex-shrink-0 text-page-muted transition-colors duration-fast group-hover:text-page-fg"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>}
        </Panel>
        </FadeIn>

        <FadeIn delay={80} className="[&>section]:h-full">
        <Panel title="Đăng ký mới" action={<Link to="/admin/nguoi-dung" className={`text-page-muted underline underline-offset-4 hover:text-page-fg rounded-control ${FOCUS}`}>Xem tất cả</Link>}>
          <ul className="divide-y divide-page-line">
            {recentSignups.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-page-fg">{u.name}</p>
                  <p className="text-xs text-page-muted">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <StatusBadge tone="muted">{ROLE_LABELS[u.role]}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
        </FadeIn>
      </div>

      <FadeIn className="mt-6">
      <Panel title="Người dùng mới 7 ngày">
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
      </FadeIn>

    </div>
  )
}
