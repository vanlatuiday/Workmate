import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader } from '@components/dashboard'
import { FlagList, JobActions, JobStatusBadges } from '@components/admin/parts'
import { companyOf } from '@pages/public/match/data'
import { useAdminJobs, type AdminJobRow } from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'

type Tab = 'pending' | 'flagged' | 'done'

const TABS: { id: Tab; label: string; empty: string; test: (r: AdminJobRow) => boolean }[] = [
  { id: 'pending', label: 'Chờ duyệt', empty: 'Không có tin nào đang chờ duyệt.', test: (r) => r.status === 'pending' },
  { id: 'flagged', label: 'Bị gắn cờ', empty: 'Không có tin đang hiện nào bị gắn cờ.', test: (r) => r.status === 'approved' && r.flags.length > 0 },
  { id: 'done', label: 'Đã xử lý', empty: 'Chưa có tin nào bị từ chối hoặc ẩn.', test: (r) => r.status === 'rejected' || r.status === 'hidden' },
]

/** Thẻ một tin cần kiểm duyệt */
function ModerationCard({ row }: { row: AdminJobRow }) {
  const { job } = row
  return (
    <li className="rounded-card border border-page-line bg-page-surface p-5">
      <div className="flex gap-4">
        <img
          src={`https://images.unsplash.com/photo-${job.photo.id}?w=200&q=70&auto=format&fit=crop`}
          alt=""
          loading="lazy"
          className="hidden h-20 w-20 flex-shrink-0 rounded-control object-cover sm:block"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-medium text-page-fg">{job.title}</h2>
            <JobStatusBadges row={row} />
          </div>
          <p className="mt-1 text-sm text-page-muted">{companyOf(job.companyId).name}</p>
          <p className="tnum mt-1 text-sm text-page-fg">{job.district} · {job.salaryLabel} · {job.shiftLabel}</p>
          {job.description ? (
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{job.description}</p>
          ) : (
            <p className="mt-2 text-sm text-page-muted">Tin chưa có mô tả.</p>
          )}
          {job.skills.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Kỹ năng">
              {job.skills.map((s) => (
                <li key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{s}</li>
              ))}
            </ul>
          )}
          {row.flags.length > 0 && <div className="mt-4"><FlagList flags={row.flags} /></div>}
          {row.reason && <p className="mt-3 text-sm text-page-fg">Lý do: {row.reason}</p>}
          <p className="mt-3 text-xs text-page-muted">{job.postedAt ? `Đăng ${formatRelativeTime(job.postedAt)}` : 'Tin có sẵn của hệ thống'}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-page-line pt-4">
        <JobActions row={row} />
      </div>
    </li>
  )
}

/** /admin/kiem-duyet — hàng chờ duyệt, tin bị tự gắn cờ và các tin đã xử lý. */
export default function Moderation() {
  const rows = useAdminJobs()
  const [tab, setTab] = useState<Tab>('pending')
  const current = TABS.find((t) => t.id === tab)!
  const list = rows
    .filter(current.test)
    .sort((a, b) => (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? '') || b.flags.length - a.flags.length)

  return (
    <div className="space-y-6">
      <PageHeader title="Kiểm duyệt" description="Duyệt tin mới đăng, xem xét tin bị hệ thống gắn cờ và khôi phục tin đã xử lý." />

      <div role="group" aria-label="Nhóm tin" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm transition-colors duration-300',
              tab === t.id ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
              FOCUS,
            )}
          >
            {t.label} <span className="tnum">({rows.filter(t.test).length})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={current.empty} description="Tin mới do doanh nghiệp đăng sẽ xuất hiện ở đây." />
      ) : (
        <ul className="space-y-4">{list.map((r) => <ModerationCard key={r.job.id} row={r} />)}</ul>
      )}

      <MockNotice />
    </div>
  )
}
