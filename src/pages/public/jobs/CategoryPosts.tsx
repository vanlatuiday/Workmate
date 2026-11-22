import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { PRESS } from '@utils/ui'
import JobDetailLink from '@components/jobs/JobDetailLink'
import { companyOf } from '@pages/public/match/data'
import type { MatchJob } from './catalog'

const ROW = cn('flex w-full items-start gap-3 rounded-control border border-wm-ivory/15 bg-wm-ivory/5 p-3 text-left hover:border-wm-cyan/60 hover:bg-wm-ivory/10', PRESS, FOCUS)

/**
 * Thẻ danh sách tin của một nhóm: đầu thẻ (tên nhóm + số tin) dính ở đỉnh thẻ cuộn, `children` là các hàng,
 * `footer` (nếu có) là liên kết phụ đặt một lần ở cuối thẻ.
 */
export function PostsCard({ label, count, unit = 'tin', children, footer }: { label: string; count: number; unit?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      {/* Bù đúng lề p-5 của thẻ cha để nền đầu thẻ phủ kín mép, hàng trượt dưới */}
      <div className="day-gcard-head sticky top-0 z-10 -mx-5 -mt-5 border-b border-wm-ivory/10 bg-wm-abyss/90 px-5 pb-3 pt-5 backdrop-blur-[16px]">
        <h2 className="font-display text-lg font-semibold leading-tight">{label}</h2>
        <p className="tnum mt-0.5 text-sm text-page-muted">{count} {unit}</p>
      </div>
      <ul role="list" className="mt-3 space-y-2">{children}</ul>
      {footer ? <div className="mt-4 border-t border-wm-ivory/10 pt-3">{footer}</div> : null}
    </>
  )
}

/** Logo công ty; chưa có thì vòng tròn chữ cái đầu */
function Logo({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    <img src={url} alt="" width={36} height={36} loading="lazy" draggable={false} className="h-9 w-9 shrink-0 rounded-full bg-wm-ivory object-cover" />
  ) : (
    <span aria-hidden className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wm-cyan/50 bg-wm-cyan/15 text-xs font-semibold text-wm-cyan">
      {name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'}
    </span>
  )
}

/** Một tin của người tìm việc / khách: logo, công ty (+ % phù hợp), tên việc, lương, ca · quận; bấm mở popup tin chi tiết */
export function JobRow({ job, score }: { job: MatchJob; score?: number }) {
  const c = companyOf(job.companyId)
  const place = [job.shiftLabel, job.district].filter(Boolean).join(' · ')
  return (
    <li>
      <JobDetailLink jobId={job.id} className={ROW}>
        <Logo name={c.name} url={c.logoUrl} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-page-muted">{c.name}</span>
            {score !== undefined && (
              <span className="tnum shrink-0 rounded-full border border-wm-cyan/50 bg-wm-cyan/15 px-1.5 text-[11px] font-semibold leading-5 text-wm-cyan" title="Độ phù hợp với hồ sơ của bạn">
                {Math.round(score)}%
              </span>
            )}
          </span>
          <span className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{job.title}</span>
          <span className="mt-1 block text-xs leading-snug text-page-muted">
            {job.salaryLabel ? <span className="block">{job.salaryLabel}</span> : null}
            {place ? <span className="block">{place}</span> : null}
          </span>
        </span>
      </JobDetailLink>
    </li>
  )
}

/** Một tin của nhà tuyển dụng: trạng thái, tên, ca · lương, số ứng viên phù hợp; bấm tới /vi-tri/:id */
export function OwnRow({ id, title, status, meta, fit }: { id: string; title: string; status: string; meta: string; fit: number }) {
  return (
    <li>
      <Link to={`/vi-tri/${id}`} state={{ from: '/viec-lam' }} className={cn(ROW, 'flex-col items-stretch gap-1')}>
        {status ? <span className="text-xs text-page-muted">{status}</span> : null}
        <span className="line-clamp-2 text-sm font-semibold leading-snug">{title}</span>
        {meta ? <span className="text-xs leading-snug text-page-muted">{meta}</span> : null}
        <span className="text-xs text-page-muted"><span className="tnum font-semibold">{fit}</span> ứng viên phù hợp</span>
      </Link>
    </li>
  )
}
