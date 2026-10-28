import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Bookmark, Briefcase, Check, Clock, GripVertical, MapPin, SearchX, SlidersHorizontal, Wallet } from 'lucide-react'
import { EmptyState, MockNotice } from '@components/dashboard'
import { useMatchStore } from '@context/matchStore'
import { expressInterest, getPairStatus, ME, resetDemoData, usePairStatuses, useOnNewConnection, withdrawInterest } from '@services/connectionService'
import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { COMPANY_PUBLIC_HREF } from '@pages/public/personal/links'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { JobType } from '@/types'
import { companyOf, SEEKER_DEFAULT, SEEKER_JOBS, type MatchJob } from './data'
import CurvedGallery from './gallery/CurvedGallery'
import CriteriaDrawer from './CriteriaDrawer'
import MatchArches from './MatchArches'
import MatchDetail from './MatchDetail'
import { CriterionBars, DetailSection, FactTiles, ImproveHint, TagList } from './detailParts'
import {
  BTN_PRIMARY, BTN_SECONDARY, filterByLevel, GalleryCaption, JobCard, LevelFilter, MatchFrame, Tabs, ViewToggle,
  type LevelKey,
} from './parts'
import {
  CRITERION_LABELS,
  DEFAULT_PRIORITY,
  scoreMatch,
  weightsOf,
  type CriterionKey,
  type MatchOutcome,
} from './score'

type SortKey = 'score' | 'salary' | 'distance'
type TabKey = 'fit' | 'saved' | 'applied' | 'connected'

/** Dời phần tử từ vị trí `from` sang `to` (trả mảng mới) */
function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Chip nhỏ dưới ảnh ở Bộ sưu tập: chỉ hiện khi đối phương đã quan tâm hoặc đã kết nối */
const chipOf = (status: string, receivedLabel: string) =>
  status === 'received' ? receivedLabel : status === 'connected' ? 'Đã kết nối' : undefined

const RANGE = `h-2 w-full cursor-pointer accent-page-fg ${FOCUS}`

/** Người tìm việc: tiêu chí lấy sẵn từ hồ sơ (chỉnh được ngay tại chỗ) + danh sách việc xếp theo điểm. */
export default function JobseekerMatch() {
  const { savedJobs, toggleSavedJob, view, setView } = useMatchStore()
  const statusOf = usePairStatuses('seeker')
  // Kết nối mới (kể cả do doanh nghiệp đáp lại sau vài giây) → báo thành công
  useOnNewConnection((c) => {
    if (c.seekerId !== ME) return
    const job = SEEKER_JOBS.find((j) => j.id === c.jobId)
    if (job) toast.success(`Kết nối thành công với ${companyOf(job.companyId).name} — ${job.title}`)
  })
  const gallery = view === 'gallery'
  // Lenis chỉ chạy ở Bộ sưu tập (canvas WebGL cần cuộn mượt đồng bộ); chế độ Danh sách giữ cuộn thường
  useSmoothScroll(gallery)

  // Tiêu chí chỉnh tại chỗ, khởi tạo từ hồ sơ; không ghi ngược lên hồ sơ
  const [salaryMinK, setSalaryMinK] = useState(SEEKER_DEFAULT.salaryMinK)
  const [maxDistanceKm, setMaxDistanceKm] = useState(SEEKER_DEFAULT.maxDistanceKm)
  const [jobTypes, setJobTypes] = useState<JobType[]>(SEEKER_DEFAULT.jobTypes)
  const [priority, setPriority] = useState<CriterionKey[]>(DEFAULT_PRIORITY)
  const [announce, setAnnounce] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const criteriaBtn = useRef<HTMLButtonElement>(null)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const [tab, setTab] = useState<TabKey>('fit')
  const [sort, setSort] = useState<SortKey>('score')
  // Bộ sưu tập: lọc theo mức phù hợp; thẻ đang mở chi tiết (kèm nút gốc để ảnh phóng ra / thu về)
  const [level, setLevel] = useState<LevelKey>('all')
  const [open, setOpen] = useState<{ id: string; origin: HTMLElement } | null>(null)

  // Chấm điểm lại mỗi khi tiêu chí hoặc thứ tự ưu tiên đổi
  const scored = useMemo(() => {
    const seeker = { ...SEEKER_DEFAULT, salaryMinK, maxDistanceKm, jobTypes }
    return SEEKER_JOBS.map((job) => ({ job, outcome: scoreMatch(seeker, job, job.distanceKm, priority) }))
  }, [salaryMinK, maxDistanceKm, jobTypes, priority])

  const lists = useMemo(() => {
    const by = (a: { job: MatchJob; outcome: MatchOutcome }, b: { job: MatchJob; outcome: MatchOutcome }) => {
      if (sort === 'salary') return b.job.salaryMaxK - a.job.salaryMaxK || b.outcome.score - a.outcome.score
      if (sort === 'distance') return a.job.distanceKm - b.job.distanceKm || b.outcome.score - a.outcome.score
      return b.outcome.score - a.outcome.score
    }
    return {
      fit: scored.filter((x) => ['none', 'received'].includes(statusOf(x.job.id, ME))).sort(by),
      saved: scored.filter((x) => savedJobs.includes(x.job.id)).sort(by),
      applied: scored.filter((x) => statusOf(x.job.id, ME) === 'sent').sort(by),
      connected: scored.filter((x) => statusOf(x.job.id, ME) === 'connected').sort(by),
    }
    // statusOf đổi tham chiếu mỗi lần kho đổi nên dùng làm dependency là đủ
  }, [scored, sort, savedJobs, statusOf])

  const current = lists[tab]
  const shown = gallery ? filterByLevel(current, level, (x) => x.outcome.score) : current
  const detail = open ? scored.find((x) => x.job.id === open.id) : undefined

  // Sau khi đổi hạng bằng nút, trả focus về đúng nút vừa bấm (hàng đã đổi chỗ trong DOM)
  const refocus = useRef<string | null>(null)
  useEffect(() => {
    if (!refocus.current) return
    const el = document.getElementById(refocus.current) as HTMLButtonElement | null
    // Nút bị khóa ở đầu/cuối danh sách thì chuyển sang nút còn lại của hàng
    ;(el && !el.disabled ? el : document.getElementById(refocus.current.replace(/-(up|down)$/, (_, d) => (d === 'up' ? '-down' : '-up'))))?.focus()
    refocus.current = null
  }, [priority])

  const reorder = (key: CriterionKey, to: number, via?: 'up' | 'down') => {
    const from = priority.indexOf(key)
    if (to < 0 || to >= priority.length || to === from) return
    setPriority(moveItem(priority, from, to))
    setAnnounce(`${CRITERION_LABELS[key]} ${to < from ? 'lên' : 'xuống'} hạng ${to + 1}`)
    if (via) refocus.current = `pri-${key}-${via}`
  }

  const [dragKey, setDragKey] = useState<CriterionKey | null>(null)
  const weights = weightsOf(priority)

  const toggleType = (t: JobType) =>
    setJobTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const apply = (job: MatchJob) => {
    // Phía kia đã quan tâm → bấm là thành kết nối ngay (toast "Kết nối thành công" do useOnNewConnection hiện)
    const waiting = getPairStatus('seeker', job.id, ME) === 'none'
    expressInterest('seeker', job.id, ME)
    if (waiting) toast.success('Đã ứng tuyển — chờ doanh nghiệp phản hồi')
  }

  // Hàng nút của một vị trí — dùng chung cho thẻ danh sách và khung chi tiết.
  // `close` chỉ có ở khung chi tiết: đổi trạng thái làm thẻ rời tab "Phù hợp" nên đóng khung (mờ dần) sau khi bấm.
  const jobActions = (job: MatchJob, close?: (quick?: boolean) => void) => {
    const saved = savedJobs.includes(job.id)
    const status = statusOf(job.id, ME)
    return (
      <>
        {status === 'none' && (
          <button type="button" onClick={() => { apply(job); close?.(true) }} className={BTN_PRIMARY}>
            Ứng tuyển<span className="sr-only"> {job.title}</span>
          </button>
        )}
        {status === 'received' && (
          <>
            <span className="inline-flex items-center rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
              Doanh nghiệp đã quan tâm bạn
            </span>
            <button type="button" onClick={() => { apply(job); close?.(true) }} className={BTN_PRIMARY}>
              Đồng ý kết nối<span className="sr-only"> {job.title}</span>
            </button>
          </>
        )}
        {status === 'sent' && (
          <>
            <button type="button" disabled className={BTN_SECONDARY}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Đã ứng tuyển · chờ phản hồi
            </button>
            <button
              type="button"
              onClick={() => withdrawInterest('seeker', job.id, ME)}
              className={`rounded-control px-1 text-xs text-page-muted underline underline-offset-4 hover:text-page-fg ${FOCUS}`}
            >
              Rút<span className="sr-only"> đơn ứng tuyển {job.title}</span>
            </button>
          </>
        )}
        {status === 'connected' && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-page-fg px-3 py-1 text-xs font-medium text-page-bg">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Đã kết nối
            </span>
            <button type="button" disabled className={BTN_SECONDARY}>Nhắn tin (sắp có)</button>
          </>
        )}
        <button type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job.id)} className={BTN_SECONDARY}>
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
          {saved ? 'Đã lưu' : 'Lưu'}
          <span className="sr-only"> {job.title}</span>
        </button>
        <Link to={COMPANY_PUBLIC_HREF} className={BTN_SECONDARY}>
          Xem công ty<span className="sr-only"> {companyOf(job.companyId).name}</span>
        </Link>
      </>
    )
  }

  const resetAll = () => {
    setPriority(DEFAULT_PRIORITY)
    setAnnounce('Đã đặt lại thứ tự ưu tiên')
  }

  // Hàng điều khiển nằm giữa tablist và tabpanel
  const toolbar = (
    <div className="mt-6 space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ViewToggle value={view} onChange={setView} />
        <button
          ref={criteriaBtn}
          type="button"
          aria-expanded={panelOpen}
          aria-controls="match-criteria"
          aria-haspopup="dialog"
          onClick={() => setPanelOpen(true)}
          className={cn(BTN_SECONDARY, '!px-3.5 !py-2')}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Tiêu chí
        </button>
        <div className="flex items-center gap-2">
          <label htmlFor="match-sort" className="text-page-muted">Sắp xếp</label>
          <select id="match-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className={`rounded-control border border-page-edge bg-page-surface px-3 py-2 text-page-fg ${FOCUS}`}>
            <option value="score">Độ phù hợp</option>
            <option value="salary">Lương cao</option>
            <option value="distance">Gần nhất</option>
          </select>
        </div>
      </div>
      {gallery && (
        <div className="flex justify-center">
          <LevelFilter scores={current.map((x) => x.outcome.score)} value={level} onChange={setLevel} />
        </div>
      )}
    </div>
  )

  return (
    <>
    {gallery && <MatchArches />}
    {/* relative z-10: nội dung nằm trên các khối vòm nền */}
    <div className="relative z-10">
    <MatchFrame
      title="Việc hợp với bạn, xếp theo điều bạn coi trọng"
      intro="Tiêu chí lấy sẵn từ hồ sơ. Đổi lương, khoảng cách hoặc thứ tự ưu tiên, danh sách tính lại ngay."
    >
          <Tabs
            center
            toolbar={toolbar}
            idPrefix="jobs"
            label="Danh sách việc"
            tabs={[
              { id: 'fit', label: 'Phù hợp', count: lists.fit.length },
              { id: 'saved', label: 'Đã lưu', count: lists.saved.length },
              { id: 'applied', label: 'Đã ứng tuyển', count: lists.applied.length },
              { id: 'connected', label: 'Đã kết nối', count: lists.connected.length },
            ]}
            value={tab}
            onChange={(id) => {
              setTab(id as TabKey)
              setLevel('all')
            }}
          >
            {shown.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={
                  current.length > 0
                    ? 'Không có việc ở mức này'
                    : tab === 'fit' ? 'Chưa có việc nào' : tab === 'saved' ? 'Chưa lưu việc nào' : tab === 'applied' ? 'Chưa ứng tuyển việc nào' : 'Chưa có kết nối nào'
                }
                description={
                  current.length > 0
                    ? 'Chọn mức phù hợp khác hoặc Tất cả để xem các việc còn lại.'
                    : tab === 'fit'
                    ? 'Bạn đã ứng tuyển hết các vị trí mẫu. Xem lại ở tab Đã ứng tuyển.'
                    : tab === 'saved'
                      ? 'Bấm Lưu ở một vị trí để xem lại tại đây.'
                      : tab === 'applied'
                        ? 'Các vị trí bạn ứng tuyển sẽ nằm ở đây.'
                        : 'Khi doanh nghiệp cũng quan tâm bạn, vị trí sẽ nằm ở đây.'
                }
              />
            ) : gallery ? (
              <div className="mx-auto max-w-6xl">
              <CurvedGallery
                items={shown.map((x) => ({ id: x.job.id, photo: x.job.photo, ...x }))}
                label="Danh sách việc dạng bộ sưu tập"
                itemLabel={({ job, outcome }) => `${job.title}, ${companyOf(job.companyId).name}, phù hợp ${outcome.score}%. Mở chi tiết`}
                renderCaption={({ job, outcome }) => (
                  <GalleryCaption
                    title={job.title}
                    subtitle={`${companyOf(job.companyId).name} · ${job.district} · ${job.salaryLabel}`}
                    score={outcome.score}
                    chip={chipOf(statusOf(job.id, ME), 'Quan tâm bạn')}
                  />
                )}
                onOpen={(item, origin) => setOpen({ id: item.id, origin })}
                hiddenId={open?.id ?? null}
              />
              </div>
            ) : (
              <ul className="mx-auto max-w-3xl space-y-4">
                {current.map(({ job, outcome }) => (
                  <li key={job.id}>
                    <JobCard job={job} outcome={outcome} actions={jobActions(job)} />
                  </li>
                ))}
              </ul>
            )}
          </Tabs>

          <div className="mx-auto mt-8 flex justify-center">
            <MockNotice />
            <button
              type="button"
              onClick={() => { resetDemoData(); toast('Đã đặt lại dữ liệu demo') }}
              className={`ml-4 rounded-control text-xs text-page-muted underline underline-offset-4 hover:text-page-fg ${FOCUS}`}
            >
              Đặt lại dữ liệu demo
            </button>
          </div>
    </MatchFrame>
    </div>


    <CriteriaDrawer id="match-criteria" open={panelOpen} onClose={closePanel} triggerRef={criteriaBtn}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs text-page-muted">Lấy sẵn từ hồ sơ. Chỉnh ở đây không đổi hồ sơ.</p>
        <Link to="/tim-viec/ho-so" className={`shrink-0 rounded-control text-xs underline underline-offset-4 ${FOCUS}`}>
          Sửa hồ sơ
        </Link>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-page-fg">Kỹ năng</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {SEEKER_DEFAULT.skills.map((s) => (
              <li key={s} className="rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-page-fg">
            Lịch rảnh <span className="font-normal text-page-muted">· {SEEKER_DEFAULT.slots.length} ca/tuần</span>
          </h3>
          {/* Lưới chỉ xem: hàng = buổi, cột = ngày; ô đặc = rảnh */}
          <div className="mt-2 grid grid-cols-[auto_repeat(7,1fr)] items-center gap-1 text-[11px] text-page-muted" role="img"
            aria-label={`Lịch rảnh ${SEEKER_DEFAULT.slots.length} ca mỗi tuần`}>
            <span />
            {DAY_SHORT.map((d) => (
              <span key={d} className="text-center">{d}</span>
            ))}
            {SESSIONS.map((s, si) => (
              <div key={s} className="contents">
                <span className="pr-1">{s}</span>
                {DAY_SHORT.map((d, di) => (
                  <span
                    key={d}
                    className={cn('h-4 rounded-md border', SEEKER_DEFAULT.slots.includes(`${di}-${si}`) ? 'border-page-fg bg-page-fg' : 'border-page-line')}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="match-salary" className="text-sm font-medium text-page-fg">Lương tối thiểu</label>
            <output htmlFor="match-salary" className="tnum text-sm text-page-muted">{salaryMinK}.000đ/giờ</output>
          </div>
          <input id="match-salary" type="range" min={15} max={60} step={1} value={salaryMinK}
            onChange={(e) => setSalaryMinK(Number(e.target.value))} className={cn(RANGE, 'mt-2')} />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="match-distance" className="text-sm font-medium text-page-fg">Khoảng cách tối đa</label>
            <output htmlFor="match-distance" className="tnum text-sm text-page-muted">{maxDistanceKm} km</output>
          </div>
          <input id="match-distance" type="range" min={1} max={15} step={1} value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))} className={cn(RANGE, 'mt-2')} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-page-fg">Loại việc</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {JOB_TYPES.map((t) => {
              const on = jobTypes.includes(t.value)
              return (
                <button key={t.value} type="button" aria-pressed={on} onClick={() => toggleType(t.value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors duration-300',
                    on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-muted hover:border-page-fg hover:text-page-fg',
                    FOCUS,
                  )}>
                  {on && <Check className="h-3 w-3" aria-hidden="true" />}
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-page-fg">Điều gì quan trọng nhất với bạn?</h3>
            <button type="button" onClick={resetAll}
              className={`rounded-control text-xs underline underline-offset-4 ${FOCUS}`}>
              Đặt lại
            </button>
          </div>
          <ol className="mt-3 space-y-1.5">
            {priority.map((key, i) => (
              <li
                key={key}
                draggable
                onDragStart={() => setDragKey(key)}
                onDragEnd={() => setDragKey(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragKey && dragKey !== key) reorder(dragKey, i)
                  setDragKey(null)
                }}
                className={cn(
                  'flex items-center gap-2 rounded-control border border-page-line bg-page-bg px-2 py-1.5 text-sm',
                  dragKey === key && 'border-page-fg',
                )}
              >
                <GripVertical className="hidden h-4 w-4 shrink-0 cursor-grab text-page-muted lg:block" aria-hidden="true" />
                <span className="tnum w-4 text-center text-page-muted">{i + 1}</span>
                <span className="flex-1 text-page-fg">{CRITERION_LABELS[key]}</span>
                <span className="tnum text-xs text-page-muted">{weights[key]}%</span>
                <button type="button" id={`pri-${key}-up`} disabled={i === 0}
                  aria-label={`Đưa ${CRITERION_LABELS[key]} lên`} onClick={() => reorder(key, i - 1, 'up')}
                  className={`rounded-control p-1.5 text-page-fg hover:bg-page-surface disabled:text-page-line disabled:hover:bg-transparent ${FOCUS}`}>
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" id={`pri-${key}-down`} disabled={i === priority.length - 1}
                  aria-label={`Đưa ${CRITERION_LABELS[key]} xuống`} onClick={() => reorder(key, i + 1, 'down')}
                  className={`rounded-control p-1.5 text-page-fg hover:bg-page-surface disabled:text-page-line disabled:hover:bg-transparent ${FOCUS}`}>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          <p className="sr-only" aria-live="polite">{announce}</p>
        </div>
      </div>
    </CriteriaDrawer>

    {detail && open && (() => {
      const { job, outcome } = detail
      const company = companyOf(job.companyId)
      const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label ?? job.jobType
      // Gợi ý: điểm nếu người tìm việc bổ sung các kỹ năng còn thiếu (giữ nguyên tiêu chí và thứ tự ưu tiên đang chọn)
      const missing = outcome.missingSkills
      const improved = missing.length
        ? Math.round(
            scoreMatch(
              { ...SEEKER_DEFAULT, salaryMinK, maxDistanceKm, jobTypes, skills: [...SEEKER_DEFAULT.skills, ...missing] },
              job,
              job.distanceKm,
              priority,
            ).score,
          )
        : 0
      return (
        <MatchDetail
          key={open.id}
          photo={job.photo}
          title={job.title}
          eyebrow={`${company.name} · ${job.district}`}
          score={outcome.score}
          origin={open.origin}
          onClosed={() => setOpen(null)}
          actions={(close) => jobActions(job, close)}
        >
          <div className="mt-6">
            <FactTiles
              items={[
                { icon: Wallet, label: 'Lương', value: job.salaryLabel },
                { icon: Clock, label: 'Ca làm', value: job.shiftLabel },
                { icon: MapPin, label: 'Khoảng cách', value: `${job.distanceKm} km` },
                { icon: Briefcase, label: 'Loại việc', value: typeLabel },
              ]}
            />
          </div>
          <DetailSection title="Vì sao hợp với bạn">
            <CriterionBars results={outcome.results} weights={weights} />
            {improved > outcome.score && (
              <ImproveHint>
                Bổ sung <strong className="font-medium">{missing.join(', ')}</strong> để lên khoảng{' '}
                <strong className="tnum font-medium">{improved}%</strong>.
              </ImproveHint>
            )}
          </DetailSection>
          <DetailSection title="Về công ty">
            <p className="text-sm leading-relaxed text-page-muted">{company.about}</p>
            <TagList tags={company.environment} />
          </DetailSection>
        </MatchDetail>
      )
    })()}
    </>
  )
}
