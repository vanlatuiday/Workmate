import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bookmark, MapPin } from 'lucide-react'
import { EmptyState, MatchScore, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { useMatchStore } from '@context/matchStore'
import { expressInterest, ME, useOnNewConnection, usePairStatuses, type PairStatus } from '@services/connectionService'
import { ALL_JOBS, seekerOutcome } from '@pages/public/jobs/catalog'
import { companyOf } from '@pages/public/match/data'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/** Nhãn + độ đậm của trạng thái nhìn từ người tìm việc */
const STATUS: Record<PairStatus, { label: string; tone: 'strong' | 'default' | 'muted' }> = {
  none: { label: 'Chưa ứng tuyển', tone: 'muted' },
  sent: { label: 'Chờ phản hồi', tone: 'default' },
  received: { label: 'Doanh nghiệp quan tâm bạn', tone: 'default' },
  connected: { label: 'Đã kết nối', tone: 'strong' },
}

/** Việc đã lưu: các việc bấm "Lưu" ở trang Kết nối, kèm điểm phù hợp và trạng thái ứng tuyển. */
export default function SavedJobs() {
  const savedJobs = useMatchStore((s) => s.savedJobs)
  const toggleSavedJob = useMatchStore((s) => s.toggleSavedJob)
  const statusOf = usePairStatuses('seeker')

  useOnNewConnection((c) => {
    if (c.seekerId === ME) toast.success('Kết nối thành công')
  })

  // Giữ thứ tự lưu, bỏ id không còn trong danh mục
  const jobs = savedJobs.flatMap((id) => ALL_JOBS.find((j) => j.id === id) ?? [])

  return (
    <div>
      <PageHeader title="Việc đã lưu" description="Những việc bạn đánh dấu để xem lại. Ứng tuyển khi sẵn sàng." />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Chưa lưu việc nào"
          description="Lưu việc ở trang Kết nối để so sánh và ứng tuyển sau."
          action={<Link to="/match" className={BTN_SOLID}>Tới trang Kết nối</Link>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-page-line">
            {jobs.map((job) => {
              const status = statusOf(job.id, ME)
              const st = STATUS[status]
              return (
                <li key={job.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Link to={`/viec-lam/${job.id}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
                        {job.title}
                      </Link>
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-page-muted">{companyOf(job.companyId).name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-page-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {job.district}, Đà Nẵng
                      </span>
                      <span>{job.salaryLabel}</span>
                      <span>{job.shiftLabel}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:flex-shrink-0">
                    <MatchScore score={seekerOutcome(job).score} size="sm" />
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'none' && (
                        <button
                          type="button"
                          className={BTN_SOLID}
                          onClick={() => {
                            expressInterest('seeker', job.id, ME)
                            toast.success('Đã ứng tuyển — chờ doanh nghiệp phản hồi')
                          }}
                        >
                          Ứng tuyển
                        </button>
                      )}
                      {status === 'received' && (
                        <button type="button" className={BTN_SOLID} onClick={() => expressInterest('seeker', job.id, ME)}>
                          Đồng ý kết nối
                        </button>
                      )}
                      {status === 'connected' && (
                        <Link to={`/tin-nhan?c=${job.id}|${ME}`} className={BTN_SOLID}>Nhắn tin</Link>
                      )}
                      <Link to="/match" className={BTN_LINE}>Xem ở Kết nối</Link>
                      <button
                        type="button"
                        className={BTN_LINE}
                        onClick={() => {
                          toggleSavedJob(job.id)
                          toast('Đã bỏ lưu')
                        }}
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
