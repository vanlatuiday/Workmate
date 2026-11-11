import CompanyLogo from '@components/common/CompanyLogo'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

import { photoSrcSet, photoUrl } from '@components/discover/types'
import { companyOf, type MatchJob } from '@pages/public/match/data'
import { JOB_TYPES } from '@constants/index'
import Tilt from '@components/motion/Tilt'
import { cn } from '@utils/cn'

/**
 * Thẻ việc làm trên trang chủ: ảnh + công ty + tên việc + lương + quận + vài nhãn.
 * `<li>` ngoài (`data-job-card`) do GSAP làm hiện dần; thẻ bên trong tự lo hiệu ứng nhấc
 * khi rê chuột / focus bàn phím — hai lớp transform tách nhau để không đè lên nhau.
 * `className` đặt cho `<li>` (vd. độ rộng trong hàng cuộn ngang).
 */
export default function JobCard({
  job,
  className,
  href,
  score,
  status,
  note,
}: {
  job: MatchJob
  className?: string
  /** Đích khi bấm — mặc định trang chi tiết việc */
  href?: string
  /** Điểm phù hợp (%) với người tìm việc — hiện huy hiệu trên ảnh */
  score?: number
  /** Trạng thái tin (nhà tuyển dụng) — hiện huy hiệu trên ảnh */
  status?: string
  /** Dòng phụ cuối thẻ, vd. "3 người quan tâm" */
  note?: string
}) {
  const company = companyOf(job.companyId)
  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label

  return (
    <li data-job-card className={className}>
      <Tilt>
      <Link
        to={href ?? `/viec-lam/${job.id}`}
        data-cursor="Xem"
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-card border border-page-line bg-page-surface',
          'transition-[transform,border-color,box-shadow] duration-500 ease-editorial',
          'hover:-translate-y-1 hover:border-page-fg hover:shadow-[0_14px_28px_-18px_var(--wm-night)]',
          'focus-visible:-translate-y-1 focus-visible:border-page-fg focus-visible:shadow-[0_14px_28px_-18px_var(--wm-night)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-fg',
          'active:scale-[0.99] motion-reduce:active:scale-100',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0',
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-wm-mist">
          <img
            src={photoUrl(job.photo.id, 640)}
            srcSet={photoSrcSet(job.photo.id)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw"
            alt={job.photo.alt}
            width={640}
            height={480}
            loading="lazy"
            data-tilt-media className="h-full w-full object-cover"
          />
          {(score !== undefined || status) && (
            <span className="absolute left-3 top-3 rounded-full bg-page-bg px-2.5 py-0.5 text-xs font-medium text-page-fg">
              {score !== undefined ? <><span className="tnum">{Math.round(score)}%</span> phù hợp</> : status}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="flex items-center gap-2 text-sm text-page-muted">
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} decorative className="h-5 w-5 text-[9px]" />
            {company.name}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-page-fg">{job.title}</h3>
          <p className="tnum mt-3 text-base font-semibold text-page-fg">{job.salaryLabel}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-page-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {job.district}, Đà Nẵng
          </p>
          {note && <p className="mt-3 text-sm font-medium text-page-fg">{note}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {typeLabel && (
              <span className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{typeLabel}</span>
            )}
            <span className="tnum rounded-full border border-page-line px-2.5 py-0.5 text-xs font-medium text-page-muted">{job.shiftLabel}</span>
          </div>
        </div>
      </Link>
      </Tilt>
    </li>
  )
}
