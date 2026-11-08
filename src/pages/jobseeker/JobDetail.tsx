import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ExternalLink } from 'lucide-react'
import { MockNotice, Panel } from '@components/dashboard'
import { photoUrl } from '@components/discover/types'
import { TagList } from '@components/discover/detail/DetailBlocks'
import SeekerJobActions from '@components/discover/detail/SeekerJobActions'
import ReportButton from '@components/report/ReportButton'
import { useCatalogStore } from '@context/catalogStore'
import { JOB_TYPES } from '@constants/index'
import { useAreaLinks } from '@hooks/useAreaLinks'
import { jobsOfCompany, seekerOutcome, useAllJobs } from '@pages/public/jobs/catalog'
import { findAnyJob } from '@pages/public/jobs/lookup'
import { companyOf } from '@pages/public/match/data'
import { CriterionBars, ImproveHint } from '@pages/public/match/detailParts'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const jobTypeLabel = (t: string) => JOB_TYPES.find((x) => x.value === t)?.label ?? t
const BACK = cn('inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-300 hover:text-page-fg', FOCUS)

/**
 * /tim-viec/viec-lam/:id — chi tiết một việc làm ngay trong dashboard người tìm việc.
 * Cùng nội dung và nút hành động với /viec-lam/:id (SeekerJobActions dùng chung),
 * nhưng dàn theo thẻ của dashboard, không có hiệu ứng cuộn.
 */
export default function JobseekerJobDetail() {
  const { id } = useParams()
  const links = useAreaLinks()
  const visibleJobs = useAllJobs()
  // Cùng trọng số mà seekerOutcome dùng (Cấu hình hệ thống) để thanh tiêu chí khớp điểm tổng
  const weights = useCatalogStore((s) => s.config.weights)

  const shown = visibleJobs.find((j) => j.id === id)
  // Tin đã ẩn/từ chối vẫn xem được (liên kết cũ) nhưng không ứng tuyển được
  const job = shown ?? (id ? findAnyJob(id) : undefined)

  const back = (
    <Link to="/tim-viec/phu-hop" className={BACK}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Việc phù hợp
    </Link>
  )

  if (!job) {
    return (
      <div>
        {back}
        <h1 className="mt-6 font-display text-2xl font-medium text-page-fg md:text-3xl">Không tìm thấy việc làm</h1>
        <p className="mt-2 max-w-xl text-page-muted">Tin này không có trong dữ liệu mẫu hoặc đường dẫn đã thay đổi.</p>
      </div>
    )
  }

  const company = companyOf(job.companyId)
  const hidden = !shown
  const others = jobsOfCompany(company.id).filter((j) => j.id !== job.id)
  const outcome = seekerOutcome(job)
  const improved = outcome.missingSkills.length > 0

  const facts: [string, string][] = [
    ['Công ty', company.name],
    ['Loại việc', jobTypeLabel(job.jobType)],
    ['Lịch', job.shiftLabel],
    ['Lương', job.salaryLabel],
    ['Địa điểm', `${job.district} · ${job.distanceKm} km`],
  ]

  return (
    <div>
      {back}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-card border border-page-line bg-page-surface">
            <img
              src={photoUrl(job.photo.id, 1000)}
              alt={job.photo.alt}
              className="aspect-[21/9] w-full object-cover"
            />
            <div className="p-5 md:p-6">
              <p className="text-sm text-page-muted">{company.name} · {jobTypeLabel(job.jobType)}</p>
              <h1 className="mt-1 font-display text-2xl font-medium text-page-fg md:text-3xl">{job.title}</h1>
              {hidden && <p className="mt-3 text-sm text-page-muted">Tin này đã ngừng hiển thị.</p>}
              {!hidden && <SeekerJobActions job={job} />}
            </div>
          </div>

          <Panel title="Độ phù hợp với bạn">
            <p className="tnum font-display text-3xl font-semibold text-page-fg">{outcome.score}%</p>
            <div className="mt-4">
              <CriterionBars results={outcome.results} weights={weights} />
            </div>
            {improved && (
              <ImproveHint>
                Bạn còn thiếu kỹ năng <strong className="font-medium">{outcome.missingSkills.join(', ')}</strong> cho vị trí này.
              </ImproveHint>
            )}
          </Panel>

          <Panel title="Kỹ năng cần có">
            {job.skills.length ? <TagList items={job.skills} /> : <p className="text-sm text-page-muted">Không yêu cầu kỹ năng đặc biệt.</p>}
          </Panel>

          <Panel title="Lịch làm việc">
            <p className="text-page-fg">{job.shiftLabel}</p>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Thông tin nhanh">
            <dl className="divide-y divide-page-line text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-page-muted">{k}</dt>
                  <dd className="text-right text-page-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Về công ty">
            <p className="text-sm leading-relaxed text-page-fg">{company.about}</p>
            {/* Trang công ty công khai: mở tab mới để không rời dashboard */}
            <Link
              to={`/cong-ty/${company.id}`}
              target="_blank"
              rel="noopener"
              className={cn('mt-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-page-fg underline underline-offset-4', FOCUS)}
            >
              Xem trang công khai
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(mở tab mới)</span>
            </Link>
          </Panel>

          {others.length > 0 && (
            <Panel title="Việc khác cùng công ty">
              <ul className="divide-y divide-page-line">
                {others.map((j) => (
                  <li key={j.id} className="first:pt-0 last:pb-0">
                    <Link to={links.job(j.id)} className={cn('group flex items-center justify-between gap-3 rounded-control py-3', FOCUS)}>
                      <span className="min-w-0">
                        <span className="block font-medium text-page-fg underline-offset-4 group-hover:underline">{j.title}</span>
                        <span className="mt-0.5 block text-xs text-page-muted">{j.salaryLabel} · {j.district}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <ReportButton target="job" targetId={job.id} name={job.title} />
        </aside>
      </div>

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
