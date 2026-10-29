import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Flag } from 'lucide-react'
import { EmptyState, PageHeader, StatusBadge } from '@components/dashboard'
import { BTN_PRIMARY, BTN_SECONDARY, ConfirmDialog, ReasonDialog, STATUS_LABEL } from '@components/admin/parts'
import { CANDIDATES, ME_CANDIDATE, companyOf } from '@pages/public/match/data'
import { findAnyJob } from '@pages/public/jobs/lookup'
import {
  resolveReport, setCompanyLocked, setModeration, setSeekerLocked, useAdmin,
  type Report,
} from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Tab = 'open' | 'done'
const TABS: { id: Tab; label: string }[] = [
  { id: 'open', label: 'Đang mở' },
  { id: 'done', label: 'Đã xử lý' },
]
const BY_LABEL: Record<Report['by'], string> = { seeker: 'Người tìm việc', recruiter: 'Nhà tuyển dụng', guest: 'Khách' }
type Action = { kind: 'dismiss' | 'hide' | 'lock'; report: Report }

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })

/** /admin/bao-cao — hàng chờ báo cáo vi phạm từ người dùng. */
export default function Reports() {
  const reports = useAdmin((s) => s.reports)
  const moderation = useAdmin((s) => s.moderation)
  const lockedCompanies = useAdmin((s) => s.lockedCompanies)
  const lockedSeekers = useAdmin((s) => s.lockedSeekers)
  const [tab, setTab] = useState<Tab>('open')
  const [action, setAction] = useState<Action | null>(null)

  const shown = useMemo(() => reports.filter((r) => (tab === 'open') === (r.status === 'open')), [reports, tab])
  const openCount = reports.filter((r) => r.status === 'open').length

  /** Mô tả đối tượng bị báo cáo + trạng thái hiện tại */
  const subjectOf = (r: Report) => {
    if (r.target === 'job') {
      const job = findAnyJob(r.targetId)
      if (!job) return { name: `Tin ${r.targetId} (không còn trong dữ liệu)`, sub: '', badges: [] as string[], companyId: undefined }
      let company = ''
      try { company = companyOf(job.companyId).name } catch { /* công ty không có trong dữ liệu mẫu */ }
      const st = moderation[job.id]?.status
      const badges = [
        ...(st && st !== 'approved' ? [STATUS_LABEL[st]] : []),
        ...(lockedCompanies[job.companyId] ? ['Công ty bị khóa'] : []),
      ]
      return { name: job.title, sub: company, badges, companyId: job.companyId, jobId: job.id }
    }
    const c = r.targetId === ME_CANDIDATE.id ? ME_CANDIDATE : CANDIDATES.find((x) => x.id === r.targetId)
    return {
      name: c ? `Ứng viên ${c.name}` : `Ứng viên ${r.targetId} (không còn trong dữ liệu)`,
      sub: c?.area ?? '',
      badges: lockedSeekers[r.targetId] ? ['Bị khóa'] : [],
      companyId: undefined,
    }
  }

  const confirm = (resolution?: string) => {
    if (!action) return
    const { kind, report: r } = action
    const s = subjectOf(r)
    if (kind === 'dismiss') {
      resolveReport(r.id, 'dismissed', resolution)
      toast.success('Đã bỏ qua báo cáo')
    } else if (kind === 'hide' && s.jobId) {
      setModeration(s.jobId, 'hidden', resolution)
      resolveReport(r.id, 'actioned', `Đã ẩn tin. ${resolution ?? ''}`.trim())
      toast.success(`Đã ẩn tin "${s.name}"`)
    } else if (kind === 'lock') {
      if (r.target === 'job' && s.companyId) {
        setCompanyLocked(s.companyId, true)
        resolveReport(r.id, 'actioned', `Đã khóa công ty ${s.sub}.`)
      } else {
        setSeekerLocked(r.targetId, true)
        resolveReport(r.id, 'actioned', `Đã khóa ${s.name}.`)
      }
      toast.success('Đã khóa tài khoản bị báo cáo')
    }
    setAction(null)
  }

  const subjectName = action ? subjectOf(action.report).name : ''

  return (
    <div>
      <PageHeader title="Báo cáo vi phạm" description="Xem các báo cáo từ người dùng về tin tuyển dụng và ứng viên, rồi bỏ qua hoặc xử lý." />

      <div role="group" aria-label="Trạng thái báo cáo" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}
            className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300', tab === t.id ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg', FOCUS)}
          >
            {t.label} <span className="tnum">({t.id === 'open' ? openCount : reports.length - openCount})</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState icon={Flag} title={tab === 'open' ? 'Không còn báo cáo nào đang mở.' : 'Chưa có báo cáo nào được xử lý.'} />
        ) : (
          <ul className="space-y-4">
            {shown.map((r) => {
              const s = subjectOf(r)
              return (
                <li key={r.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-page-muted">{r.target === 'job' ? 'Tin tuyển dụng' : 'Ứng viên'}</p>
                      <h2 className="font-display text-lg font-medium text-page-fg">{s.name}</h2>
                      {s.sub && <p className="mt-0.5 text-sm text-page-muted">{s.sub}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                      <StatusBadge tone="default">{r.reason}</StatusBadge>
                      {s.badges.map((b) => <StatusBadge key={b} tone="strong">{b}</StatusBadge>)}
                    </div>
                  </div>
                  {r.note && <p className="mt-3 text-sm text-page-fg">{r.note}</p>}
                  <p className="mt-3 text-xs text-page-muted">Người báo: {BY_LABEL[r.by]} · <span className="tnum">{fmtTime(r.at)}</span></p>

                  {r.status === 'open' ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setAction({ kind: 'dismiss', report: r })} className={BTN_SECONDARY}>
                        Bỏ qua<span className="sr-only"> báo cáo về {s.name}</span>
                      </button>
                      {r.target === 'job' && s.jobId && (moderation[s.jobId]?.status ?? 'approved') !== 'hidden' && (
                        <button type="button" onClick={() => setAction({ kind: 'hide', report: r })} className={BTN_SECONDARY}>
                          Ẩn tin<span className="sr-only"> {s.name}</span>
                        </button>
                      )}
                      {((r.target === 'job' && s.companyId && !lockedCompanies[s.companyId]) || (r.target === 'seeker' && !lockedSeekers[r.targetId])) && (
                        <button type="button" onClick={() => setAction({ kind: 'lock', report: r })} className={BTN_PRIMARY}>
                          {r.target === 'job' ? 'Khóa công ty' : 'Khóa ứng viên'}<span className="sr-only"> {s.name}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-page-line pt-3 text-sm">
                      <p className="text-page-fg">
                        <span className="text-page-muted">Kết quả: </span>{r.status === 'dismissed' ? 'Đã bỏ qua' : 'Đã xử lý'}
                      </p>
                      {r.resolution && <p className="mt-1 text-page-fg"><span className="text-page-muted">Ghi chú: </span>{r.resolution}</p>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {action?.kind === 'dismiss' && (
        <ReasonDialog title="Bỏ qua báo cáo" subtitle={subjectName} confirmLabel="Bỏ qua báo cáo" onCancel={() => setAction(null)} onConfirm={confirm} />
      )}
      {action?.kind === 'hide' && (
        <ReasonDialog title="Ẩn tin bị báo cáo" subtitle={subjectName} confirmLabel="Ẩn tin" onCancel={() => setAction(null)} onConfirm={confirm} />
      )}
      {action?.kind === 'lock' && (
        <ConfirmDialog
          title={action.report.target === 'job' ? 'Khóa công ty' : 'Khóa ứng viên'}
          message={action.report.target === 'job'
            ? `Khóa công ty đăng tin "${subjectName}"? Mọi tin của công ty sẽ bị ẩn.`
            : `Khóa ${subjectName}? Ứng viên sẽ không còn hiện cho doanh nghiệp.`}
          confirmLabel="Khóa"
          onCancel={() => setAction(null)}
          onConfirm={() => confirm()}
        />
      )}
    </div>
  )
}
