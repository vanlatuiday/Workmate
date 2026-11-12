import CompanyLogo from '@components/common/CompanyLogo'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ChevronDown, MapPin, SearchX } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { EmptyState, MatchScore, PageHeader, SkeletonCards } from '@components/dashboard'
import { cn } from '@utils/cn'
import type { JobType } from '@/types'
import { useCatalogStore } from '@context/catalogStore'
import { useMatchStore } from '@context/matchStore'
import { useSeekerCriteria } from '@context/profileStore'
import { useAllJobs, useSeekerOutcomes, type MatchJob } from '@pages/public/jobs/catalog'
import { companyOf } from '@pages/public/match/data'
import { CRITERION_LABELS, type MatchOutcome } from '@pages/public/match/score'
import { FOCUS } from '@utils/focus'
import PopIcon from '@components/common/PopIcon'
import { useFlip } from '@hooks/useFlip'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'

const FIELD = `rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

type SortKey = 'match' | 'salary' | 'distance'

const MIN_SCORES = [
  { value: 0, label: 'Tất cả' },
  { value: 60, label: 'Từ 60%' },
  { value: 80, label: 'Từ 80%' },
]

/** Thanh mảnh cho từng tiêu chí trong phân rã điểm phù hợp */
function CriterionBar({ label, value }: { label: string; value: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-page-muted">{label}</span>
        <span className="tnum font-medium text-page-fg">{value}%</span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${value}%`}
        className="mt-1 h-1 overflow-hidden rounded-full bg-page-line"
      >
        <div className="h-full rounded-full bg-page-fg" style={{ width: `${value}%` }} />
      </div>
    </li>
  )
}

type Scored = { job: MatchJob; outcome: MatchOutcome }

function JobCard({ job, outcome, saved, onToggleSave }: Scored & { saved: boolean; onToggleSave: () => void }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label

  return (
    <article data-flip-key={job.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium text-page-fg">{job.title}</h2>
          <p className="mt-1 text-sm text-page-muted flex items-center gap-2">
            <CompanyLogo name={companyOf(job.companyId).name} logoUrl={companyOf(job.companyId).logoUrl} decorative className="h-5 w-5 text-[9px]" />
            {companyOf(job.companyId).name}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-page-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {job.district}, Đà Nẵng · <span className="tnum">{job.distanceKm.toLocaleString('vi-VN')} km</span>
            </span>
            <span>{job.salaryLabel}</span>
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-page-muted">
            <span className="rounded-full border border-page-line px-2.5 py-0.5">{typeLabel}</span>
            <span>Ca làm: {job.shiftLabel}</span>
          </p>
        </div>
        <MatchScore score={outcome.score} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={saved}
          onClick={onToggleSave}
          className={cn(BTN_SECONDARY, BTN_SM, saved && 'border-page-fg')}
        >
          <PopIcon icon={saved ? BookmarkCheck : Bookmark} on={saved} fill={false} />
          {saved ? 'Đã lưu' : 'Lưu'}
        </button>
        <Link
          to={`/viec-lam/${job.id}`}
          className={cn(BTN_PRIMARY, BTN_SM)}
        >
          Xem chi tiết
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`ml-auto inline-flex items-center gap-1 rounded-control text-sm text-page-fg underline underline-offset-4 ${FOCUS}`}
        >
          Vì sao phù hợp?
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-base', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>

      <div id={panelId} hidden={!open} className="mt-5 border-t border-page-line pt-5">
        {open && (<>
          <p className="mb-4 text-sm text-page-muted">Điểm phù hợp được tính từ 5 tiêu chí:</p>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {outcome.results.map((r) => (
              <CriterionBar key={r.key} label={CRITERION_LABELS[r.key]} value={Math.round(r.value * 100)} />
            ))}
          </ul>
        </>)}
      </div>
    </article>
  )
}

export default function RecommendedJobs() {
  const [type, setType] = useState<'all' | JobType>('all')
  const [minScore, setMinScore] = useState(0)
  const [sort, setSort] = useState<SortKey>('match')
  const savedJobs = useMatchStore((s) => s.savedJobs)
  const toggleSave = useMatchStore((s) => s.toggleSavedJob)
  const catalogLoaded = useCatalogStore((s) => s.loaded)
  const typeId = useId()
  const scoreId = useId()
  const sortId = useId()

  // Điểm tính một lần cho cả danh mục (cùng cách tính với trang Kết nối)
  const allJobs = useAllJobs()
  const criteria = useSeekerCriteria() // đổi hồ sơ -> chấm điểm lại
  const { ready: scoresReady, outcomeOf } = useSeekerOutcomes()
  // Tin chưa có điểm từ máy chủ (vừa tạo) thì chưa gợi ý
  const scored = useMemo<Scored[]>(
    () => allJobs.flatMap((job) => { const outcome = outcomeOf(job); return outcome ? [{ job, outcome }] : [] }),
    [allJobs, criteria, outcomeOf],
  )

  const jobs = useMemo(() => {
    const list = scored.filter((x) => (type === 'all' || x.job.jobType === type) && x.outcome.score >= minScore)
    return [...list].sort((a, b) =>
      sort === 'salary'
        ? b.job.salaryMaxK - a.job.salaryMaxK
        : sort === 'distance'
          ? a.job.distanceKm - b.job.distanceKm
          : b.outcome.score - a.outcome.score,
    )
  }, [scored, type, minScore, sort])

  const flipRef = useFlip<HTMLDivElement>(jobs.map((x) => x.job.id))

  const reset = () => {
    setType('all')
    setMinScore(0)
  }

  return (
    <div>
      <PageHeader
        title="Việc phù hợp với bạn"
        description="Gợi ý dựa trên kỹ năng, lịch rảnh, khoảng cách, mức lương và nguyện vọng trong hồ sơ."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={typeId} className="text-sm text-page-muted">Loại việc</label>
          <select id={typeId} value={type} onChange={(e) => setType(e.target.value as 'all' | JobType)} className={FIELD}>
            <option value="all">Tất cả loại việc</option>
            {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={scoreId} className="text-sm text-page-muted">Mức phù hợp tối thiểu</label>
          <select id={scoreId} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className={FIELD}>
            {MIN_SCORES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={sortId} className="text-sm text-page-muted">Sắp xếp theo</label>
          <select id={sortId} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={FIELD}>
            <option value="match">Phù hợp nhất</option>
            <option value="salary">Lương cao nhất</option>
            <option value="distance">Gần nhất</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-page-muted" role="status">{jobs.length} việc phù hợp</p>

      {(!catalogLoaded && allJobs.length === 0) || !scoresReady ? (
        <SkeletonCards count={3} className="space-y-4" label="Đang tải việc phù hợp…" />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Không có việc nào khớp bộ lọc"
          description="Thử hạ mức phù hợp tối thiểu hoặc chọn loại việc khác."
          action={<button type="button" onClick={reset} className={BTN_SECONDARY}>Xóa bộ lọc</button>}
        />
      ) : (
        <div ref={flipRef} className="space-y-4">
          {jobs.map(({ job, outcome }) => (
            <JobCard key={job.id} job={job} outcome={outcome} saved={savedJobs.includes(job.id)} onToggleSave={() => toggleSave(job.id)} />
          ))}
        </div>
      )}

    </div>
  )
}
