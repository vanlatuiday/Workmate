import { Link } from 'react-router-dom'
import { Briefcase, UserCheck, Handshake, CalendarClock, Plus, Video, MapPin } from 'lucide-react'
import { PageHeader, Panel, StatCard, StatusBadge, MatchScore, MockNotice } from '@components/dashboard'
import { MOCK_JOBS, MOCK_CANDIDATES, MOCK_INTERVIEWS, JOB_STATUS_LABELS } from './mockData'
import { FOCUS } from '@utils/focus'

const LINK = `underline-offset-4 hover:underline text-page-fg rounded-control ${FOCUS}`

const STATUS_TONE = { open: 'strong', paused: 'default', closed: 'muted', draft: 'muted' } as const

export default function RecruiterDashboard() {
  // Dữ liệu mẫu — thay bằng API
  const openJobs = MOCK_JOBS.filter((j) => j.status === 'open').length
  const newCandidates = [...MOCK_CANDIDATES].sort((a, b) => b.score - a.score).slice(0, 4)
  const jobTitle = (id: string) => MOCK_JOBS.find((j) => j.id === id)?.title ?? ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan tuyển dụng"
        description="Theo dõi tin đang mở, ứng viên phù hợp và lịch phỏng vấn trong tuần."
        actions={
          <Link
            to="/tuyen-dung/dang-tin"
            className={`inline-flex items-center gap-2 rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Đăng tin mới
          </Link>
        }
      />
      <MockNotice />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tin đang mở" value={openJobs} icon={Briefcase} href="/tuyen-dung/tin-dang" hint="Trên tổng 6 tin" />
        <StatCard label="Ứng viên phù hợp mới" value={24} icon={UserCheck} href="/tuyen-dung/ung-vien-phu-hop" hint="Trong 7 ngày qua" />
        <StatCard label="MATCH" value={6} icon={Handshake} href="/tuyen-dung/match" hint="Hai bên cùng quan tâm" />
        <StatCard label="Phỏng vấn tuần này" value={MOCK_INTERVIEWS.length} icon={CalendarClock} href="/tuyen-dung/lich-phong-van" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Ứng viên phù hợp mới"
          action={<Link to="/tuyen-dung/ung-vien-phu-hop" className={LINK}>Xem tất cả</Link>}
        >
          <ul className="divide-y divide-page-line">
            {newCandidates.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-page-line text-sm font-medium text-page-fg"
                >
                  {c.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-page-fg">{c.name}</p>
                  <p className="truncate text-xs text-page-muted">{jobTitle(c.jobId)}</p>
                </div>
                <MatchScore score={c.score} size="sm" />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Tin tuyển dụng"
          action={<Link to="/tuyen-dung/tin-dang" className={LINK}>Quản lý tin</Link>}
        >
          <ul className="divide-y divide-page-line">
            {MOCK_JOBS.slice(0, 5).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-page-fg">{j.title}</p>
                  <p className="text-xs text-page-muted">{j.suggested} ứng viên phù hợp</p>
                </div>
                <StatusBadge tone={STATUS_TONE[j.status]}>{JOB_STATUS_LABELS[j.status]}</StatusBadge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Lịch phỏng vấn sắp tới"
        action={<Link to="/tuyen-dung/lich-phong-van" className={LINK}>Xem lịch</Link>}
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {MOCK_INTERVIEWS.map((i) => {
            const Icon = i.mode === 'online' ? Video : MapPin
            return (
              <li key={i.id} className="rounded-card border border-page-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-page-fg">{i.candidate}</p>
                  <StatusBadge tone="default">{i.mode === 'online' ? 'Online' : 'Trực tiếp'}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-page-muted">{i.job}</p>
                <p className="tnum mt-3 text-sm text-page-fg">{i.time}</p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-page-muted">
                  <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  {i.place}
                </p>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
