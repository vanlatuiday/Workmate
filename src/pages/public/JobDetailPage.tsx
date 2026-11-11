import { useEffect, useRef } from 'react'
import CompanyLogo from '@components/common/CompanyLogo'
import { useLocation, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bookmark, Check } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useMatchStore } from '@context/matchStore'
import { useCatalogStore } from '@context/catalogStore'
import { APPLICATION_STAGE_LABEL, expressInterest, ME, useApplicationStage, useOnNewConnection, usePairStatuses, withdrawInterest } from '@services/connectionService'
import { JOB_TYPES } from '@constants/index'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import BackLink from '@components/discover/detail/BackLink'
import JobLinks from '@components/discover/detail/JobLinks'
import { TagList, TextBlock } from '@components/discover/detail/DetailBlocks'
import ReportButton from '@components/report/ReportButton'
import api from '@services/api'
import { cn } from '@utils/cn'
import { jobsOfCompany, seekerOutcome, useAllJobs, type MatchJob } from './jobs/catalog'
import { findAnyJob } from './jobs/lookup'
import { companyOf } from './match/data'
import { CriterionBars, ImproveHint } from './match/detailParts'
import { BTN_ACCENT, BTN_DANGER, BTN_SECONDARY } from '@utils/ui'
import MessageLink from '@components/messenger/MessageLink'

const jobTypeLabel = (t: string) => JOB_TYPES.find((x) => x.value === t)?.label ?? t

/** Hàng nút của người tìm việc: ứng tuyển / chờ phản hồi / nhắn tin + lưu tin. */
function SeekerActions({ job }: { job: MatchJob }) {
  const { savedJobs, toggleSavedJob } = useMatchStore()
  const status = usePairStatuses('seeker')(job.id, ME)
  const stage = useApplicationStage(job.id, ME)
  const saved = savedJobs.includes(job.id)
  const toastId = `ung-tuyen-${job.id}`

  // Kết nối mới (kể cả do doanh nghiệp đáp lại sau vài giây) → báo thành công
  useOnNewConnection((c) => {
    if (c.jobId === job.id && c.seekerId === ME) toast.success('Kết nối thành công')
  })

  const apply = () => {
    const waiting = status === 'none'
    expressInterest('seeker', job.id, ME)
    if (waiting) toast.success('Đã ứng tuyển — chờ doanh nghiệp phản hồi', { id: toastId })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {status === 'none' && (
        <button type="button" onClick={apply} className={BTN_ACCENT}>
          Ứng tuyển
        </button>
      )}
      {status === 'received' && (
        <button type="button" onClick={apply} className={BTN_ACCENT}>
          Đồng ý kết nối
        </button>
      )}
      {status === 'sent' && (
        <>
          <button type="button" disabled className={BTN_SECONDARY}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Đã ứng tuyển · {APPLICATION_STAGE_LABEL[stage ?? 'applied']}
          </button>
          <button
            type="button"
            onClick={() => {
              withdrawInterest('seeker', job.id, ME)
              toast.dismiss(toastId)
            }}
            className={BTN_DANGER}
          >
            Rút<span className="sr-only"> đơn ứng tuyển</span>
          </button>
        </>
      )}
      {status === 'connected' && (
        <MessageLink convKey={`${job.id}|${ME}`} className={BTN_ACCENT}>
          Nhắn tin
        </MessageLink>
      )}
      <button type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job.id)} className={BTN_SECONDARY}>
        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
        {saved ? 'Đã lưu' : 'Lưu'}
      </button>
    </div>
  )
}

/** /viec-lam/:id — chi tiết một việc làm. Nút và điểm phù hợp theo vai trò. */
export default function JobDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const role = useAuthStore((s) => s.user?.role)
  const visibleJobs = useAllJobs()
  // Cùng trọng số mà seekerOutcome dùng (Cấu hình hệ thống) để thanh tiêu chí khớp điểm tổng
  const weights = useCatalogStore((s) => s.config.weights)

  const shown = visibleJobs.find((j) => j.id === id)
  // Tin đã ẩn/từ chối vẫn xem được (liên kết cũ) nhưng không ứng tuyển được
  const job = shown ?? (id ? findAnyJob(id) : undefined)

  // Đếm lượt xem đúng một lần cho mỗi tin được mở (ref chặn StrictMode chạy effect hai lần và render lại)
  const viewedRef = useRef<string | null>(null)
  const publicId = shown?.id
  useEffect(() => {
    if (!publicId || viewedRef.current === publicId) return
    viewedRef.current = publicId
    api.post(`/jobs/${encodeURIComponent(publicId)}/view`).catch(() => undefined)
  }, [publicId])

  if (!job) {
    return (
      <DetailNotFound
        title="Không tìm thấy việc làm"
        text="Tin này không có trên Workmate hoặc đường dẫn đã thay đổi."
      />
    )
  }

  const company = companyOf(job.companyId)
  const hidden = !shown
  const others = jobsOfCompany(company.id).filter((j) => j.id !== job.id)
  const outcome = role === 'jobseeker' ? seekerOutcome(job) : null
  const improved = outcome && outcome.missingSkills.length > 0
  const required = job.requiredSkills ?? []
  const preferred = job.skills.filter((s) => !required.includes(s))

  const aside = (
    <>
      <CompanyLogo name={company.name} logoUrl={company.logoUrl} className="mb-4 h-14 w-14 text-base" />
      <p className="max-w-sm text-base md:text-lg leading-relaxed">
        {company.name} tuyển cho vị trí này tại {job.district}, mức {job.salaryLabel}.
      </p>
      {hidden && <p className="mt-4 text-sm text-page-muted">Tin này đã ngừng hiển thị.</p>}
      <Facts
        rows={[
          ['Công ty', company.name],
          ['Loại việc', jobTypeLabel(job.jobType)],
          ['Lịch', job.shiftLabel],
          ['Lương', job.salaryLabel],
          ['Địa điểm', `${job.district} · ${job.distanceKm} km`],
        ]}
      />

      {role === 'jobseeker' && !hidden && <SeekerActions job={job} />}

      {!role && !hidden && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <PrimaryLink accent to="/dang-nhap" state={{ from: location.pathname + location.search }}>
            Đăng nhập để ứng tuyển
          </PrimaryLink>
          <TextLink to="/dang-ky?role=jobseeker">Đăng ký</TextLink>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        <TextLink to={`/cong-ty/${company.id}`}>Xem công ty</TextLink>
        {role === 'admin' && <TextLink to="/admin/tin-tuyen-dung">Quản lý tin tuyển dụng</TextLink>}
      </div>
    </>
  )

  return (
    <article className="pb-section-sm">
      <DetailHero
        back={<BackLink />}
        eyebrow={`${company.name} · ${jobTypeLabel(job.jobType)}`}
        title={job.title}
        photo={job.photo}
      />

      <DetailLayout aside={aside}>
        {outcome && (
          <TextBlock title="Độ phù hợp với bạn">
            <p className="tnum font-display text-3xl font-semibold">{outcome.score}%</p>
            <div className="mt-4">
              <CriterionBars results={outcome.results} weights={weights} />
            </div>
            {outcome.unmet.length > 0 && (
              <ImproveHint>
                Bạn chưa đạt yêu cầu bắt buộc của tin: <strong className="font-medium">{outcome.unmet.join(', ')}</strong>. Điểm phù hợp của bạn với vị trí này bị giữ ở mức thấp cho đến khi bạn đáp ứng đủ.
              </ImproveHint>
            )}
            {improved && outcome.unmet.length === 0 && (
              <ImproveHint>
                Bạn còn thiếu kỹ năng <strong className="font-medium">{outcome.missingSkills.join(', ')}</strong> cho vị trí này.
              </ImproveHint>
            )}
          </TextBlock>
        )}

        <TextBlock title="Kỹ năng cần có">
          {!job.skills.length ? (
            <p className="text-page-muted">Không yêu cầu kỹ năng đặc biệt.</p>
          ) : required.length ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-page-muted">Bắt buộc</p>
                <TagList items={required} strong />
              </div>
              {preferred.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-page-muted">Ưu tiên</p>
                  <TagList items={preferred} />
                </div>
              )}
            </div>
          ) : (
            <TagList items={job.skills} />
          )}
        </TextBlock>

        <TextBlock title="Lịch làm việc">
          <p className="text-base md:text-lg leading-relaxed">{job.shiftLabel}</p>
          {job.requireAllSlots && <p className="mt-2 text-sm text-page-muted">Bắt buộc rảnh đủ mọi ca.</p>}
        </TextBlock>

        <TextBlock title="Về công ty">
          <p className="text-base md:text-lg leading-relaxed">{company.about}</p>
        </TextBlock>

        {others.length > 0 && (
          <TextBlock title="Việc khác cùng công ty">
            <JobLinks jobs={others} />
          </TextBlock>
        )}

        <p className="text-xs text-page-muted">Ảnh minh họa từ Unsplash.</p>
        {role && (
          <div>
            <ReportButton target="job" targetId={job.id} name={job.title} />
          </div>
        )}
      </DetailLayout>
    </article>
  )
}
