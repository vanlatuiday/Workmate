import CompanyLogo from '@components/common/CompanyLogo'
import { Link } from 'react-router-dom'
import { notifySuccess } from '@utils/feedback'
import { Bookmark, MapPin } from 'lucide-react'
import { EmptyState, MatchScore, PageHeader, Panel, SkeletonList, StatusBadge } from '@components/dashboard'
import { useCatalogStore } from '@context/catalogStore'
import { useMatchStore } from '@context/matchStore'
import { APPLICATION_STAGE_LABEL, expressInterest, ME, useApplicationStages, useOnNewConnection, usePairStatuses, type PairStatus } from '@services/connectionService'
import { useAllJobs, useSeekerOutcomes } from '@pages/public/jobs/catalog'
import { companyOf } from '@pages/public/match/data'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { useFlip } from '@hooks/useFlip'
import FadeIn from '@components/motion/FadeIn'
import MessageLink from '@components/messenger/MessageLink'


/** Nhãn + độ đậm của trạng thái nhìn từ người tìm việc */
const STATUS: Record<PairStatus, { label: string; tone: 'accent' | 'soft' | 'neutral' | 'muted' }> = {
  none: { label: 'Chưa ứng tuyển', tone: 'muted' },
  sent: { label: 'Chờ phản hồi', tone: 'neutral' },
  received: { label: 'Doanh nghiệp quan tâm bạn', tone: 'soft' },
  connected: { label: 'Đã kết nối', tone: 'accent' },
}

/** Việc đã lưu: các việc bấm "Lưu" ở trang Kết nối, kèm điểm phù hợp và trạng thái ứng tuyển. */
export default function SavedJobs() {
  const savedJobs = useMatchStore((s) => s.savedJobs)
  const toggleSavedJob = useMatchStore((s) => s.toggleSavedJob)
  const statusOf = usePairStatuses('seeker')
  const stageOf = useApplicationStages()
  const catalogLoaded = useCatalogStore((s) => s.loaded)
  const { outcomeOf } = useSeekerOutcomes()

  useOnNewConnection((c) => {
    if (c.seekerId === ME) notifySuccess('Đã kết nối — giờ hai bên nhắn tin được')
  })

  // Giữ thứ tự lưu, bỏ id không còn trong danh mục
  const allJobs = useAllJobs()
  const jobs = savedJobs.flatMap((id) => allJobs.find((j) => j.id === id) ?? [])
  const flipRef = useFlip<HTMLUListElement>(jobs.map((j) => j.id))

  return (
    <div>
      <PageHeader title="Việc đã lưu" description="Những việc bạn đánh dấu để xem lại. Ứng tuyển khi sẵn sàng." />

      {!catalogLoaded && jobs.length === 0 && savedJobs.length > 0 ? (
        <Panel><SkeletonList rows={3} label="Đang tải việc đã lưu…" /></Panel>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Chưa lưu việc nào"
          description="Lưu việc ở trang Kết nối để so sánh và ứng tuyển sau."
          action={<Link to="/match" className={BTN_ACCENT}>Tới trang Kết nối</Link>}
        />
      ) : (
        <FadeIn>
        <Panel>
          <ul ref={flipRef} className="divide-y divide-page-line">
            {jobs.map((job) => {
              const status = statusOf(job.id, ME)
              const stage = status === 'sent' ? stageOf(job.id, ME) : undefined
              const st = stage && stage !== 'applied'
                ? { label: APPLICATION_STAGE_LABEL[stage].replace(/^./, (c) => c.toUpperCase()), tone: stage === 'considering' ? 'soft' as const : 'neutral' as const }
                : STATUS[status]
              return (
                <li key={job.id} data-flip-key={job.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Link to={`/viec-lam/${job.id}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
                        {job.title}
                      </Link>
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-page-muted flex items-center gap-2">
            <CompanyLogo name={companyOf(job.companyId).name} logoUrl={companyOf(job.companyId).logoUrl} decorative className="h-5 w-5 text-[9px]" />
            {companyOf(job.companyId).name}
          </p>
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
                    {outcomeOf(job) && <MatchScore score={outcomeOf(job)!.score} size="sm" />}
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'none' && (
                        <button
                          type="button"
                          className={cn(BTN_PRIMARY, BTN_SM)}
                          onClick={() => {
                            expressInterest('seeker', job.id, ME)
                          }}
                        >
                          Ứng tuyển
                        </button>
                      )}
                      {status === 'received' && (
                        <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => expressInterest('seeker', job.id, ME)}>
                          Đồng ý kết nối
                        </button>
                      )}
                      {status === 'connected' && (
                        <MessageLink convKey={`${job.id}|${ME}`} className={cn(BTN_PRIMARY, BTN_SM)}>Nhắn tin</MessageLink>
                      )}
                      <Link to="/match" className={cn(BTN_SECONDARY, BTN_SM)}>Xem ở Kết nối</Link>
                      <button
                        type="button"
                        className={cn(BTN_SECONDARY, BTN_SM)}
                        onClick={() => {
                          toggleSavedJob(job.id)
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
        </FadeIn>
      )}

    </div>
  )
}
