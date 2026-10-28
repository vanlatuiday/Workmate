import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, ClipboardList, Eye, MapPin, Zap } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { JOB_TYPES, APPLICATION_STATUS_LABELS } from '@constants/index'
import { EmptyState, MatchScore, MockNotice, PageHeader, Panel, StatCard, StatusBadge } from '@components/dashboard'
import type { ApplicationStatus } from '@/types'
import { DASHBOARD_STATS, RECENT_APPLICATIONS } from './mockData'
import { ALL_JOBS, seekerOutcome } from '@pages/public/jobs/catalog'
import { companyOf } from '@pages/public/match/data'
import { FOCUS } from '@utils/focus'

const LINK = `underline underline-offset-4 text-page-fg hover:text-page-muted transition-colors duration-300 rounded-control ${FOCUS}`

const STATUS_TONE: Partial<Record<ApplicationStatus, 'strong' | 'default' | 'muted'>> = {
  interview_invited: 'strong',
  considering: 'default',
  viewed: 'muted',
}

// Mức hoàn thiện hồ sơ mẫu
const PROFILE_PERCENT = 80

export default function JobseekerDashboard() {
  const { user } = useAuthStore()
  const name = user?.email?.split('@')[0] ?? 'bạn'
  // 3 việc điểm cao nhất theo cách tính chung (catalog.ts)
  const jobs = ALL_JOBS.map((job) => ({ job, outcome: seekerOutcome(job) }))
    .sort((a, b) => b.outcome.score - a.outcome.score)
    .slice(0, 3)

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${name}`}
        description="3 việc hợp nhất với hồ sơ và lịch rảnh của bạn đang chờ ở dưới."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Đã ứng tuyển" value={DASHBOARD_STATS.applied} icon={ClipboardList} href="/tim-viec/ung-tuyen" />
        <StatCard label="NTD đã xem" value={DASHBOARD_STATS.viewed} icon={Eye} href="/tim-viec/ung-tuyen" />
        <StatCard label="Việc đã lưu" value={DASHBOARD_STATS.saved} icon={Bookmark} href="/tim-viec/da-luu" />
        <StatCard label="Kết nối" value={DASHBOARD_STATS.match} icon={Zap} href="/tim-viec/match" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Việc phù hợp với bạn"
          className="lg:col-span-2"
          action={<Link to="/tim-viec/phu-hop" className={LINK}>Xem tất cả</Link>}
        >
          <ul className="divide-y divide-page-line">
            {jobs.map(({ job, outcome }) => (
              <li key={job.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/viec-lam/${job.id}`} className={`font-medium text-page-fg hover:underline underline-offset-4 rounded-control ${FOCUS}`}>
                    {job.title}
                  </Link>
                  <p className="mt-1 text-sm text-page-muted">{companyOf(job.companyId).name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-page-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {job.district}, Đà Nẵng
                    </span>
                    <span>{job.salaryLabel}</span>
                    <span>{JOB_TYPES.find((t) => t.value === job.jobType)?.label}</span>
                  </p>
                </div>
                <MatchScore score={outcome.score} size="sm" />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Hồ sơ của bạn" action={<Link to="/tim-viec/ho-so" className={LINK}>Hoàn thiện</Link>}>
          <p className="tnum font-display text-3xl font-medium text-page-fg">{PROFILE_PERCENT}%</p>
          <div
            role="progressbar"
            aria-label="Mức hoàn thiện hồ sơ"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={PROFILE_PERCENT}
            className="mt-3 h-1 overflow-hidden rounded-full bg-page-line"
          >
            <div className="h-full rounded-full bg-page-fg" style={{ width: `${PROFILE_PERCENT}%` }} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-page-muted">
            Còn thiếu lịch rảnh cho vài buổi trong tuần. Lịch rảnh càng đầy đủ, việc gợi ý càng sát với bạn.
          </p>
          <Link
            to="/tim-viec/ho-so"
            className={`mt-5 inline-flex items-center gap-2 rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`}
          >
            Cập nhật hồ sơ <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Panel>
      </div>

      <Panel
        title="Đơn ứng tuyển gần đây"
        className="mt-6"
        action={<Link to="/tim-viec/ung-tuyen" className={LINK}>Xem tất cả</Link>}
      >
        {RECENT_APPLICATIONS.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Chưa có đơn ứng tuyển" description="Hãy ứng tuyển việc đầu tiên." />
        ) : (
          <ul className="divide-y divide-page-line">
            {RECENT_APPLICATIONS.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-page-fg">{a.title}</p>
                  <p className="text-sm text-page-muted">{a.company} · nộp ngày {a.appliedAt}</p>
                </div>
                <StatusBadge tone={STATUS_TONE[a.status] ?? 'muted'}>{APPLICATION_STATUS_LABELS[a.status]}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
