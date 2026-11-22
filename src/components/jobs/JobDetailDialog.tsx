import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Bookmark, Check } from 'lucide-react'
import CompanyLogo from '@components/common/CompanyLogo'
import PopIcon from '@components/common/PopIcon'
import DialogShell from '@components/interview/DialogShell'
import JobLinks from '@components/discover/detail/JobLinks'
import { TagList } from '@components/discover/detail/DetailBlocks'
import { Facts, TextLink } from '@components/discover/parts'
import { photoUrl } from '@components/discover/types'
import ReportButton from '@components/report/ReportButton'
import { useAuthStore } from '@context/authStore'
import { useMatchStore } from '@context/matchStore'
import { useMessengerStore } from '@context/messengerStore'
import { useCatalogStore, type CatalogCompany, type CatalogJob } from '@context/catalogStore'
import { DAYS_OF_WEEK, JOB_TYPES } from '@constants/index'
import { SESSION_HOURS, type SessionIndex } from '@components/home/shiftBoard'
import { useSeekerOutcomes } from '@pages/public/jobs/catalog'
import { companyRecruitingJobs } from '@pages/public/personal/companyRecruitingJobs'
import { CriterionBars, ImproveHint } from '@pages/public/match/detailParts'
import { APPLICATION_STAGE_LABEL, CONNECTED_MESSAGE, expressInterest, ME, useApplicationStage, useOnNewConnection, usePairStatuses, withdrawInterest } from '@services/connectionService'
import api from '@services/api'
import { notifySuccess } from '@utils/feedback'
import { BTN_ACCENT, BTN_DANGER, BTN_SECONDARY } from '@utils/ui'

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function slotLabel(slot: string) {
  const [day, session] = slot.split('-').map(Number)
  const dayLabel = DAYS_OF_WEEK[day]?.label
  const sessionLabel = SESSION_HOURS[session as SessionIndex]?.name
  return dayLabel && sessionLabel ? `${dayLabel} · ${sessionLabel}` : slot
}

/** Giữ trạng thái ứng tuyển và kết nối cả khi tin đã ngừng tuyển. */
function SeekerActions({ job, recruiting, onClose }: { job: CatalogJob; recruiting: boolean; onClose: () => void }) {
  const saved = useMatchStore((s) => s.savedJobs.includes(job.id))
  const toggleSavedJob = useMatchStore((s) => s.toggleSavedJob)
  const status = usePairStatuses('seeker')(job.id, ME)
  const stage = useApplicationStage(job.id, ME)

  useOnNewConnection((connection) => {
    if (connection.jobId === job.id && connection.seekerId === ME) notifySuccess(CONNECTED_MESSAGE)
  })

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {recruiting && (status === 'none' || status === 'received') && (
        <button type="button" onClick={() => expressInterest('seeker', job.id, ME)} className={BTN_ACCENT}>
          {status === 'received' ? 'Đồng ý kết nối' : 'Ứng tuyển'}
        </button>
      )}
      {status === 'sent' && (
        <>
          <p className="flex items-start gap-1.5 text-sm text-page-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Đã ứng tuyển · {APPLICATION_STAGE_LABEL[stage ?? 'applied']}
          </p>
          <button type="button" onClick={() => withdrawInterest('seeker', job.id, ME)} className={BTN_DANGER}>
            Rút<span className="sr-only"> đơn ứng tuyển</span>
          </button>
        </>
      )}
      {status === 'connected' && (
        <button type="button" className={BTN_ACCENT} onClick={() => {
          onClose()
          useMessengerStore.getState().openMessenger(`${job.id}|${ME}`)
        }}>Nhắn tin</button>
      )}
      <button type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job.id)} className={BTN_SECONDARY}>
        <PopIcon icon={Bookmark} on={saved} />
        {saved ? 'Đã lưu' : 'Lưu'}
      </button>
    </div>
  )
}

function JobContent({ job, company, jobs, onClose }: { job: CatalogJob; company: CatalogCompany; jobs: CatalogJob[]; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const weights = useCatalogStore((s) => s.config.weights)
  const { outcomeOf } = useSeekerOutcomes()
  const recruitingJobs = companyRecruitingJobs(jobs, company.id)
  const recruiting = recruitingJobs.some((item) => item.id === job.id)
  const others = recruitingJobs.filter((item) => item.id !== job.id)
  const outcome = user?.role === 'jobseeker' ? outcomeOf(job) : undefined
  const required = job.requiredSkills ?? []
  const preferred = job.skills.filter((skill) => !required.includes(skill))

  return (
    <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <aside className="min-w-0">
        <div className="day-card rounded-card p-4">
          {photoUrl(job.photo, 640) && (
            <img src={photoUrl(job.photo, 640)} alt={job.photo.alt} className="mb-4 aspect-[16/9] w-full rounded-control object-cover" decoding="async" />
          )}
          <div className="flex items-center gap-3">
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} decorative className="h-12 w-12 text-sm" />
            <div className="min-w-0">
              <p className="break-words font-display font-semibold">{company.name}</p>
              <p className="mt-1 text-sm text-page-muted">{company.industry}</p>
            </div>
          </div>
          <Facts dense rows={[
            ['Loại việc', JOB_TYPES.find((type) => type.value === job.jobType)?.label ?? job.jobType],
            ['Lương', job.salaryLabel],
            ['Lịch', job.shiftLabel],
            ['Địa điểm', job.district],
            ['Khoảng cách', `${job.distanceKm} km`],
            ['Số lượng', `${job.quantity} người`],
          ]} />
          {!recruiting && <p className="mt-4 text-sm text-page-muted">Tin này đã ngừng tuyển. Bạn vẫn có thể xem lại thông tin.</p>}
          {user?.role === 'jobseeker' && <SeekerActions key={`${user.id}:${job.id}`} job={job} recruiting={recruiting} onClose={onClose} />}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <TextLink to={`/cong-ty/${company.id}`}>Xem công ty</TextLink>
            {user?.role === 'admin' && <TextLink to="/admin/tin-tuyen-dung">Quản lý tin</TextLink>}
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6 break-words">
        <DetailSection title="Mô tả công việc">
          <p className="whitespace-pre-wrap">{job.description || 'Nhà tuyển dụng chưa bổ sung mô tả công việc.'}</p>
        </DetailSection>

        {outcome && (
          <DetailSection title="Độ phù hợp với bạn">
            <p className="tnum font-display text-3xl font-semibold">{outcome.score}%</p>
            <div className="mt-4"><CriterionBars results={outcome.results} weights={weights} /></div>
            {outcome.unmet.length > 0 ? (
              <ImproveHint>
                Bạn chưa đạt yêu cầu bắt buộc của tin: <strong className="font-medium">{outcome.unmet.join(', ')}</strong>. Điểm phù hợp của bạn với vị trí này bị giữ ở mức thấp cho đến khi bạn đáp ứng đủ.
              </ImproveHint>
            ) : outcome.missingSkills.length > 0 && (
              <ImproveHint>Bạn còn thiếu kỹ năng <strong className="font-medium">{outcome.missingSkills.join(', ')}</strong> cho vị trí này.</ImproveHint>
            )}
          </DetailSection>
        )}

        <DetailSection title="Kỹ năng cần có">
          {!job.skills.length && !required.length ? (
            <p className="text-page-muted">Không yêu cầu kỹ năng đặc biệt.</p>
          ) : required.length ? (
            <div className="space-y-4">
              <div><p className="mb-2 text-page-muted">Bắt buộc</p><TagList items={required} strong /></div>
              {preferred.length > 0 && <div><p className="mb-2 text-page-muted">Ưu tiên</p><TagList items={preferred} /></div>}
            </div>
          ) : <TagList items={job.skills} />}
        </DetailSection>

        <DetailSection title="Lịch làm việc">
          <p>{job.shiftLabel}</p>
          {job.slots.length > 0 && <div className="mt-3"><TagList items={job.slots.map(slotLabel)} /></div>}
          {job.requireAllSlots && <p className="mt-3 text-page-muted">Bắt buộc rảnh đủ mọi ca.</p>}
        </DetailSection>

        <DetailSection title="Về công ty">
          <p className="whitespace-pre-wrap">{company.about || 'Công ty chưa bổ sung phần giới thiệu.'}</p>
        </DetailSection>

        {others.length > 0 && <DetailSection title="Việc khác cùng công ty"><JobLinks jobs={others} /></DetailSection>}
        {user && <ReportButton target="job" targetId={job.id} name={job.title} />}
      </div>
    </div>
  )
}

/** Chi tiết tin trên màn hình hiện tại; chỉ dùng danh mục đã tải từ máy chủ. */
export default function JobDetailDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const titleId = useId()
  const jobs = useCatalogStore((s) => s.jobs)
  const companies = useCatalogStore((s) => s.companies)
  const loaded = useCatalogStore((s) => s.loaded)
  const settled = useCatalogStore((s) => s.settled)
  const load = useCatalogStore((s) => s.load)
  const [retrying, setRetrying] = useState(false)
  const job = loaded ? jobs.find((item) => item.id === jobId) : undefined
  const company = job ? companies.find((item) => item.id === job.companyId) : undefined
  const viewed = useRef(new Set<string>())
  const publicId = job?.visible && company ? job.id : undefined

  useEffect(() => {
    if (!publicId || viewed.current.has(publicId)) return
    viewed.current.add(publicId)
    void api.post(`/jobs/${encodeURIComponent(publicId)}/view`).catch(() => undefined)
  }, [publicId])

  return (
    <DialogShell titleId={titleId} title={job?.title ?? 'Chi tiết việc làm'} subtitle={company?.name} onClose={onClose} contentKey={jobId} className="theme-day bg-wm-day text-page-fg md:max-w-5xl">
      {!settled || retrying ? (
        <p role="status" className="py-8 text-sm text-page-muted">Đang tải việc làm…</p>
      ) : !loaded ? (
        <div className="py-6">
          <p role="status" className="text-sm text-page-muted">Chưa tải được thông tin việc làm. Vui lòng thử lại.</p>
          <button type="button" className={`${BTN_SECONDARY} mt-4`} onClick={async () => {
            setRetrying(true)
            try { await load() } finally { setRetrying(false) }
          }}>Thử tải lại</button>
        </div>
      ) : !job || !company ? (
        <div className="py-6">
          <h3 className="font-display text-lg font-semibold">Không tìm thấy việc làm</h3>
          <p className="mt-3 text-sm text-page-muted">Tin này không còn trên Workmate hoặc bạn không có quyền xem thông tin này.</p>
        </div>
      ) : <JobContent key={job.id} job={job} company={company} jobs={jobs} onClose={onClose} />}
    </DialogShell>
  )
}
