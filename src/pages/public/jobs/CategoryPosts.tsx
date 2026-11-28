import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Banknote, ChevronDown, Clock, MapPin, Users } from 'lucide-react'
import { cn } from '@utils/cn'
import { COMPACT_JOBS_GALLERY } from '@components/discover/types'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { FOCUS } from '@utils/focus'
import { PRESS } from '@utils/ui'
import { useCatalogStore } from '@context/catalogStore'
import JobDetailLink from '@components/jobs/JobDetailLink'
import { companyOf } from '@pages/public/match/data'
import type { MatchJob } from './catalog'

/** Hàng bấm được: viền + nền mờ (kính tối); ban ngày .day-post trong index.css đổi sang thẻ trắng, hover nền day-tint */
const ROW = cn('day-post block w-full rounded-control border border-wm-ivory/15 bg-wm-ivory/5 text-left hover:border-wm-cyan/60 hover:bg-wm-ivory/10', PRESS, FOCUS)
const SUB_ROW = cn('day-post-sub flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-wm-ivory/10', PRESS, FOCUS)

/** Phần tử công ty rút gọn cho đầu thẻ (chồng logo) */
interface CompanyBrief { id: string }

/** Thông tin hiển thị của một công ty: tên, logo (danh mục / dữ liệu mẫu) + trạng thái đã xác minh */
function useCompanyView(id: string) {
  const c = companyOf(id)
  const verified = useCatalogStore((s) => s.companies.some((x) => x.id === id && x.verified))
  return { name: c.name, logoUrl: c.logoUrl, verified }
}

/**
 * Thẻ danh sách tin của một nhóm: đầu thẻ (tên nhóm + tóm tắt + chồng logo công ty) dính ở đỉnh thẻ cuộn,
 * `children` là các hàng, `footer` (nếu có) là liên kết phụ đặt một lần ở cuối thẻ.
 * `companies`: các công ty đang tuyển trong nhóm (đã xếp thứ tự) → hiện "N công ty · M tin" và chồng logo.
 */
export function PostsCard({ label, count, unit = 'tin', companies, children, footer }: { label: string; count: number; unit?: string; companies?: CompanyBrief[]; children: ReactNode; footer?: ReactNode }) {
  const compact = useMediaQuery(COMPACT_JOBS_GALLERY)
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  const listLabel = companies ? 'danh sách công ty' : 'danh sách vị trí'
  const summary = companies ? `${companies.length} công ty · ${count} ${unit}` : `${count} ${unit}`
  return (
    <>
      {/* sticky -top-5: bù lề p-5 của thẻ cuộn (sticky tính từ mép trong lề) — bù đúng lề p-5 của thẻ cha để nền đầu thẻ phủ kín mép, hàng trượt dưới */}
      <div className="day-gcard-head sticky -top-5 z-10 -mx-5 -mt-5 flex items-center justify-between gap-3 border-b border-wm-ivory/10 bg-wm-abyss/90 px-5 pb-3 pt-5 backdrop-blur-[16px]">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold leading-tight">{label}</h2>
          <p className="tnum mt-0.5 text-sm text-page-muted">{summary}</p>
        </div>
        {!compact && companies && companies.length > 0 ? (
          <div aria-hidden className="flex shrink-0 items-center">
            {companies.slice(0, 4).map((c, i) => (
              <Logo key={c.id} id={c.id} size="xs" className={cn('ring-2 ring-wm-abyss day-stack-item', i > 0 && '-ml-2')} />
            ))}
            {companies.length > 4 ? <span className="tnum ml-1.5 text-xs font-semibold text-page-muted">+{companies.length - 4}</span> : null}
          </div>
        ) : null}
      </div>
      {compact && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className={cn(ROW, 'mt-3 flex min-h-11 items-center justify-between gap-2 px-3 text-sm font-semibold')}
        >
          {expanded ? 'Ẩn' : 'Xem'} {listLabel}
          <ChevronDown aria-hidden className={cn('h-4 w-4 shrink-0', expanded && 'rotate-180')} />
        </button>
      )}
      <div id={listId} hidden={compact && !expanded}>
        <ul role="list" className="mt-3 space-y-2">{children}</ul>
        {footer ? <div className="mt-4 border-t border-wm-ivory/10 pt-3">{footer}</div> : null}
      </div>
    </>
  )
}

/** Màu ô chữ cái đầu (token wm-*, chữ day ≥ 4.5:1): chọn theo id để mỗi công ty giữ một màu */
const TINTS = ['bg-wm-abyss', 'bg-wm-ocean', 'bg-wm-azure', 'bg-wm-iris'] as const
const tintOf = (id: string) => TINTS[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TINTS.length]

/** Logo công ty trong ô vuông bo góc: có logo → nền ngà, viền mảnh, ảnh co vừa ô; chưa có → ô màu đặc + chữ cái đầu */
function Logo({ id, size = 'md', className }: { id: string; size?: 'xs' | 'md'; className?: string }) {
  const { name, logoUrl } = useCompanyView(id)
  const box = size === 'xs' ? 'h-7 w-7 text-[10px]' : 'h-12 w-12 text-sm'
  return logoUrl ? (
    <img src={logoUrl} alt="" width={48} height={48} loading="lazy" draggable={false} className={cn('shrink-0 rounded-control border border-page-line bg-wm-ivory object-contain p-1', box, className)} />
  ) : (
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-control border border-page-line font-display font-semibold text-wm-day', tintOf(id), box, className)}>
      {name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'}
    </span>
  )
}

/** Tên công ty (dòng đậm nhất của hàng) + dấu đã xác minh */
function CompanyName({ id }: { id: string }) {
  const { name, verified } = useCompanyView(id)
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate font-display text-base font-semibold leading-tight">{name}</span>
      {verified ? (
        <>
          <BadgeCheck aria-hidden className="day-verified h-4 w-4 shrink-0 text-wm-cyan" />
          <span className="sr-only">Đã xác minh</span>
        </>
      ) : null}
    </span>
  )
}

/** Chip % phù hợp (ban ngày .day-chip đổi sang nền day-tint + chữ abyss để đọc được trên thẻ trắng) */
function ScoreChip({ score }: { score: number }) {
  return (
    <span className="day-chip tnum shrink-0 rounded-full border border-wm-cyan/50 bg-wm-cyan/15 px-2 text-xs font-semibold leading-5 text-wm-cyan" title="Độ phù hợp với hồ sơ của bạn">
      {Math.round(score)}%
    </span>
  )
}

/** Một dòng meta có icon nhỏ */
function Meta({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Lương · ca · quận, ngăn bằng khoảng trắng và xuống dòng khi hẹp */
function JobMeta({ job, noDistrict }: { job: MatchJob; noDistrict?: boolean }) {
  return (
    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs leading-snug text-page-muted">
      {job.salaryLabel ? <Meta icon={Banknote}>{job.salaryLabel}</Meta> : null}
      {job.shiftLabel ? <Meta icon={Clock}>{job.shiftLabel}</Meta> : null}
      {!noDistrict && job.district ? <Meta icon={MapPin}>{job.district}</Meta> : null}
    </span>
  )
}

/** Các tin của một công ty trong nhóm (đã xếp tin phù hợp nhất lên đầu) */
interface CompanyPosts<J extends MatchJob = MatchJob> {
  companyId: string
  jobs: J[]
  /** Điểm phù hợp của từng tin (nếu có) */
  scores: Map<string, number | undefined>
}

/**
 * Gom tin của một nhóm theo công ty. Công ty nhiều tin hơn lên trước; khi có điểm (người tìm việc)
 * thì công ty có tin phù hợp nhất lên trước, hòa điểm thì theo số tin. Tin trong công ty: điểm cao trước, rồi giữ thứ tự mới nhất.
 */
export function groupByCompany<J extends MatchJob>(jobs: J[], scoreOf?: (j: J) => number | undefined): CompanyPosts<J>[] {
  const by = new Map<string, CompanyPosts<J>>()
  for (const j of jobs) {
    const g: CompanyPosts<J> = by.get(j.companyId) ?? { companyId: j.companyId, jobs: [], scores: new Map() }
    g.jobs.push(j)
    g.scores.set(j.id, scoreOf?.(j))
    by.set(j.companyId, g)
  }
  const best = (g: CompanyPosts<J>) => Math.max(-1, ...g.jobs.map((j) => g.scores.get(j.id) ?? -1))
  const list = [...by.values()]
  for (const g of list) g.jobs.sort((a, b) => (g.scores.get(b.id) ?? -1) - (g.scores.get(a.id) ?? -1)) // sort ổn định
  return list.sort((a, b) => (scoreOf ? best(b) - best(a) || b.jobs.length - a.jobs.length : b.jobs.length - a.jobs.length))
}

/**
 * Một công ty đang tuyển: 1 tin → cả hàng là một nút (logo, tên công ty đậm, tên việc, meta);
 * nhiều tin → đầu công ty (logo, tên, "N vị trí") rồi các tin nhỏ bên dưới, mỗi tin bấm riêng.
 */
export function CompanyBlock({ group }: { group: CompanyPosts }) {
  const { companyId, jobs, scores } = group
  if (jobs.length === 1) {
    const job = jobs[0]
    const score = scores.get(job.id)
    return (
      <li>
        <JobDetailLink jobId={job.id} className={cn(ROW, 'flex min-h-14 items-start gap-3 p-3')}>
          <Logo id={companyId} />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <CompanyName id={companyId} />
              {score !== undefined && <ScoreChip score={score} />}
            </span>
            <span className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{job.title}</span>
            <JobMeta job={job} />
          </span>
        </JobDetailLink>
      </li>
    )
  }
  return (
    <li className="day-post overflow-hidden rounded-control border border-wm-ivory/15 bg-wm-ivory/5">
      <div className="flex items-center gap-3 p-3 pb-2.5">
        <Logo id={companyId} />
        <div className="min-w-0 flex-1">
          <CompanyName id={companyId} />
          <p className="tnum mt-0.5 text-xs text-page-muted">{jobs.length} vị trí đang tuyển</p>
        </div>
      </div>
      <ul role="list" className="day-post-list divide-y divide-wm-ivory/10 border-t border-wm-ivory/10">
        {jobs.map((job) => {
          const score = scores.get(job.id)
          return (
            <li key={job.id}>
              <JobDetailLink jobId={job.id} className={SUB_ROW}>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-snug">{job.title}</span>
                  <JobMeta job={job} />
                </span>
                {score !== undefined && <ScoreChip score={score} />}
              </JobDetailLink>
            </li>
          )
        })}
      </ul>
    </li>
  )
}

/** Một tin của nhà tuyển dụng: trạng thái, tên, ca · lương, số ứng viên phù hợp; bấm tới /vi-tri/:id */
export function OwnRow({ id, title, status, meta, fit }: { id: string; title: string; status: string; meta: string; fit: number }) {
  return (
    <li>
      <Link to={`/vi-tri/${id}`} state={{ from: '/viec-lam' }} className={cn(ROW, 'min-h-14 space-y-1 p-3')}>
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 font-display text-base font-semibold leading-snug">{title}</span>
          {status ? <span className="day-chip shrink-0 rounded-full border border-wm-ivory/25 px-2 text-xs leading-5 text-page-muted">{status}</span> : null}
        </span>
        {meta ? <span className="flex items-start gap-1 text-xs leading-snug text-page-muted"><Clock aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />{meta}</span> : null}
        <span className="flex items-center gap-1 text-xs text-page-muted"><Users aria-hidden className="h-3.5 w-3.5 shrink-0" /><span><span className="tnum font-semibold">{fit}</span> ứng viên phù hợp</span></span>
      </Link>
    </li>
  )
}
