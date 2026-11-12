import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PopIcon from '@components/common/PopIcon'
import { Link } from 'react-router-dom'
import { notifySuccess } from '@utils/feedback'
import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, Briefcase, Check, Clock, GripVertical, MapPin, SearchX, SlidersHorizontal, Wallet, X } from 'lucide-react'
import InterviewAction from '@components/interview/InterviewAction'
import { EmptyState } from '@components/dashboard'
import { useMatchStore } from '@context/matchStore'
import { APPLICATION_STAGE_LABEL, expressInterest, ME, useApplicationStages, usePairStatuses, useOnNewConnection, withdrawInterest } from '@services/connectionService'
import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatHourlyFromK } from '@utils/format'
import type { JobType } from '@/types'
import { companyOf, SEEKER_JOBS, type MatchJob } from './data'
import { useCatalogStore } from '@context/catalogStore'
import { useSeekerCriteria } from '@context/profileStore'
import { useAllJobs } from '@pages/public/jobs/catalog'
import { reweight, useSeekerMatches } from '@services/matchingService'
import { findAnyJob } from '@pages/public/jobs/lookup'
import CurvedGallery from './gallery/CurvedGallery'
import CriteriaDrawer from './CriteriaDrawer'
import MatchSearchBar, { BarSelect, ChipReset, FilterMenu, LevelMenu } from './MatchSearchBar'
import ReportButton from '@components/report/ReportButton'
import MatchDetail from './MatchDetail'
import { CriterionBars, DetailSection, FactTiles, ImproveHint, TagList } from './detailParts'
import {
  filterByLevel, foldMatches, GalleryCaption, JobCard, MatchFrame, Tabs, ViewToggle,
  type LevelKey,
} from './parts'
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { useFlip } from '@hooks/useFlip'
import {
  CRITERION_LABELS,
  DEFAULT_PRIORITY,
  scoreMatch,
  weightsOf,
  type CriterionKey,
  type MatchOutcome,
} from './score'
import MessageLink from '@components/messenger/MessageLink'

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

/** Mốc chip lương / khoảng cách ở thanh tìm */
const SALARY_STEPS = [25, 30, 35, 40]
const DISTANCE_STEPS = [3, 5, 10]

const RANGE = `h-2 w-full cursor-pointer accent-page-fg ${FOCUS}`

/** Người tìm việc: tiêu chí lấy sẵn từ hồ sơ (chỉnh được ngay tại chỗ) + danh sách việc xếp theo điểm. */
export default function JobseekerMatch() {
  const { savedJobs, toggleSavedJob, view, setView } = useMatchStore()
  const statusOf = usePairStatuses('seeker')
  const stageOf = useApplicationStages()
  // Kết nối mới (kể cả do doanh nghiệp đáp lại sau vài giây) → báo thành công
  useOnNewConnection((c) => {
    if (c.seekerId !== ME) return
    if (findAnyJob(c.jobId)) notifySuccess('Đã kết nối — giờ hai bên nhắn tin được')
  })
  const gallery = view === 'gallery'
  // Lenis chỉ chạy ở Bộ sưu tập (canvas WebGL cần cuộn mượt đồng bộ); chế độ Danh sách giữ cuộn thường
  useSmoothScroll(gallery)

  // Tiêu chí chỉnh tại chỗ, khởi tạo từ hồ sơ (profileStore); không ghi ngược lên hồ sơ
  const base = useSeekerCriteria()
  const [salaryMinK, setSalaryMinK] = useState(base.salaryMinK)
  const [maxDistanceKm, setMaxDistanceKm] = useState(base.maxDistanceKm)
  const [jobTypes, setJobTypes] = useState<JobType[]>(base.jobTypes)
  const [priority, setPriority] = useState<CriterionKey[]>(DEFAULT_PRIORITY)
  const [announce, setAnnounce] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const criteriaBtn = useRef<HTMLButtonElement>(null)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const [tab, setTab] = useState<TabKey>('fit')
  const [sort, setSort] = useState<SortKey>('score')
  const [query, setQuery] = useState('')
  // Bộ sưu tập: lọc theo mức phù hợp; thẻ đang mở chi tiết (kèm nút gốc để ảnh phóng ra / thu về)
  const [level, setLevel] = useState<LevelKey>('all')
  const [open, setOpen] = useState<{ id: string; origin: HTMLElement } | null>(null)

  // Chấm điểm lại mỗi khi tiêu chí hoặc thứ tự ưu tiên đổi
  const allJobs = useAllJobs()
  // Danh mục từ máy chủ đã gồm cả tin bị ẩn/tạm dừng/đóng mà người này có quan hệ
  const catalogJobs = useCatalogStore((s) => s.jobs)
  // Mọi việc kể cả tin đã bị ẩn/tạm dừng/đóng: để Đã lưu / Đã ứng tuyển / Đã kết nối không mất việc đã có quan hệ
  const pool = useMemo(() => {
    const seen = new Set(allJobs.map((j) => j.id))
    const rest = [...catalogJobs, ...SEEKER_JOBS].filter((j) => !seen.has(j.id) && (seen.add(j.id), true))
    return [...allJobs, ...rest]
  }, [allJobs, catalogJobs])
  const visibleIds = useMemo(() => new Set(allJobs.map((j) => j.id)), [allJobs])
  // Điểm: máy chủ là nguồn sự thật. Đổi thứ tự ưu tiên → nhân lại trọng số trên điểm từng tiêu chí (không gọi lại máy chủ).
  // Chỉ khi người dùng chỉnh thử lương / bán kính / loại việc tại chỗ (không lưu vào hồ sơ) hoặc tin chưa có điểm
  // (tin đã ẩn người này còn quan hệ) mới tính tại chỗ bằng scoreMatch.
  const { ready: scoresReady, weights: serverWeights, outcomeOf } = useSeekerMatches()
  const tweaked = salaryMinK !== base.salaryMinK || maxDistanceKm !== base.maxDistanceKm
    || jobTypes.length !== base.jobTypes.length || jobTypes.some((t) => !base.jobTypes.includes(t))
  const customPriority = priority.some((k, i) => k !== DEFAULT_PRIORITY[i])
  const scored = useMemo(() => {
    const seeker = { ...base, salaryMinK, maxDistanceKm, jobTypes }
    return pool.map((job) => {
      const server = tweaked ? undefined : outcomeOf(job.id)
      if (server) return { job, outcome: customPriority ? { ...server, score: reweight(server, weightsOf(priority)) } : server }
      return { job, outcome: scoreMatch(seeker, job, job.distanceKm, customPriority ? priority : undefined) }
    })
  }, [pool, base, salaryMinK, maxDistanceKm, jobTypes, priority, tweaked, customPriority, scoresReady, outcomeOf])

  const lists = useMemo(() => {
    const by = (a: { job: MatchJob; outcome: MatchOutcome }, b: { job: MatchJob; outcome: MatchOutcome }) => {
      if (sort === 'salary') return b.job.salaryMaxK - a.job.salaryMaxK || b.outcome.score - a.outcome.score
      if (sort === 'distance') return a.job.distanceKm - b.job.distanceKm || b.outcome.score - a.outcome.score
      return b.outcome.score - a.outcome.score
    }
    return {
      fit: scored.filter((x) => visibleIds.has(x.job.id) && ['none', 'received'].includes(statusOf(x.job.id, ME))).sort(by),
      saved: scored.filter((x) => savedJobs.includes(x.job.id)).sort(by),
      applied: scored.filter((x) => statusOf(x.job.id, ME) === 'sent').sort(by),
      connected: scored.filter((x) => statusOf(x.job.id, ME) === 'connected').sort(by),
    }
    // statusOf đổi tham chiếu mỗi lần kho đổi nên dùng làm dependency là đủ
  }, [scored, sort, savedJobs, statusOf, visibleIds])

  // Ô tìm theo tên việc + công ty, áp lên tab đang chọn (cả hai chế độ xem)
  const current = useMemo(
    () => lists[tab].filter((x) => foldMatches([x.job.title, companyOf(x.job.companyId).name], query)),
    [lists, tab, query],
  )
  // Lọc theo mức phù hợp áp cho cả danh sách lẫn bộ sưu tập
  const shown = filterByLevel(current, level, (x) => x.outcome.score)
  // Danh sách thẻ sắp xếp lại mượt khi đổi tab / lọc / sắp xếp
  const flipRef = useFlip<HTMLUListElement>(shown.map((x) => x.job.id))
  // Danh mục chưa về từ máy chủ: hiện khung chờ thay vì "Chưa có việc nào"
  const catalogSettled = useCatalogStore((s) => s.settled)
  const waiting = (!catalogSettled && allJobs.length === 0) || !scoresReady
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
  const weights = customPriority || !serverWeights ? weightsOf(priority) : serverWeights

  const toggleType = (t: JobType) =>
    setJobTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const apply = (job: MatchJob) => {
    // Phản hồi thành công (ứng tuyển / đã kết nối) do connectionService báo
    expressInterest('seeker', job.id, ME)
  }

  // Hàng nút của một vị trí — dùng chung cho thẻ danh sách và khung chi tiết.
  // `close` chỉ có ở khung chi tiết: đổi trạng thái làm thẻ rời tab "Phù hợp" nên đóng khung (mờ dần) sau khi bấm.
  const jobActions = (job: MatchJob, close?: (quick?: boolean) => void) => {
    const saved = savedJobs.includes(job.id)
    const status = statusOf(job.id, ME)
    return (
      <>
        {status === 'none' && (
          <button type="button" onClick={() => { apply(job); close?.(true) }} className={cn(BTN_PRIMARY, BTN_SM)}>
            Ứng tuyển<span className="sr-only"> {job.title}</span>
          </button>
        )}
        {status === 'received' && (
          <>
            <span className="inline-flex items-center rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
              Doanh nghiệp đã quan tâm bạn
            </span>
            <button type="button" onClick={() => { apply(job); close?.(true) }} className={cn(BTN_PRIMARY, BTN_SM)}>
              Đồng ý kết nối<span className="sr-only"> {job.title}</span>
            </button>
          </>
        )}
        {status === 'sent' && (
          <>
            <button type="button" disabled className={cn(BTN_SECONDARY, BTN_SM)}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Đã ứng tuyển · {APPLICATION_STAGE_LABEL[stageOf(job.id, ME) ?? 'applied']}
            </button>
            <button
              type="button"
              onClick={() => withdrawInterest('seeker', job.id, ME)}
              className={cn(BTN_DANGER, BTN_SM)}
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
            <MessageLink convKey={`${job.id}|${ME}`} className={cn(BTN_SECONDARY, BTN_SM)}>
              Nhắn tin<span className="sr-only"> {job.title}</span>
            </MessageLink>
            <InterviewAction viewer="seeker" jobId={job.id} seekerId={ME} />
          </>
        )}
        <button type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job.id)} className={cn(BTN_SECONDARY, BTN_SM)}>
          <PopIcon icon={Bookmark} on={saved} />
          {saved ? 'Đã lưu' : 'Lưu'}
          <span className="sr-only"> {job.title}</span>
        </button>
        <Link to={`/cong-ty/${job.companyId}`} className={cn(BTN_SECONDARY, BTN_SM)}>
          Xem công ty<span className="sr-only"> {companyOf(job.companyId).name}</span>
        </Link>
      </>
    )
  }

  const resetAll = () => {
    setPriority(DEFAULT_PRIORITY)
    setAnnounce('Đã đặt lại thứ tự ưu tiên')
  }

  // Chip đổi chính các tiêu chí chấm điểm (cùng state với ngăn Tiêu chí) nên danh sách tính lại ngay
  const typesChanged = jobTypes.length !== base.jobTypes.length || jobTypes.some((t) => !base.jobTypes.includes(t))
  const activeCount =
    (query ? 1 : 0) + (level !== 'all' ? 1 : 0) + (salaryMinK !== base.salaryMinK ? 1 : 0) + (maxDistanceKm !== base.maxDistanceKm ? 1 : 0) + (typesChanged ? 1 : 0)
  const dirty = activeCount > 0
  const clearFilters = () => {
    setQuery('')
    setSalaryMinK(base.salaryMinK)
    setMaxDistanceKm(base.maxDistanceKm)
    setJobTypes(base.jobTypes)
    setLevel('all')
  }

  // Hàng điều khiển nằm giữa tablist và tabpanel
  const toolbar = (
    <div className="mt-6 flex justify-center text-sm">
      <ViewToggle value={view} onChange={setView} />
    </div>
  )

  return (
    <>
    <div className="relative z-10">
    <MatchFrame
      title="Việc hợp với bạn, xếp theo điều bạn coi trọng"
      intro="Tiêu chí lấy sẵn từ hồ sơ. Đổi lương, khoảng cách hoặc thứ tự ưu tiên, danh sách tính lại ngay."
    >
          <MatchSearchBar
            query={query}
            onQueryChange={setQuery}
            placeholder="Tìm việc, công ty…"
            searchLabel="Tìm theo tên việc hoặc công ty"
            activeCount={activeCount}
            segments={() => (
              <BarSelect icon={<ArrowUpDown className="h-4 w-4" />} label="Sắp xếp" value={sort} onChange={(v) => setSort(v as SortKey)} className="sm:w-44">
                <option value="score">Độ phù hợp</option>
                <option value="salary">Lương cao</option>
                <option value="distance">Gần nhất</option>
              </BarSelect>
            )}
            action={(floating) => (
              <button
                ref={floating ? undefined : criteriaBtn}
                type="button"
                aria-expanded={panelOpen}
                aria-controls="match-criteria"
                aria-haspopup="dialog"
                onClick={() => setPanelOpen(true)}
                className={cn(BTN_PRIMARY, BTN_SM)}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Tiêu chí
              </button>
            )}
            chips={(floating) => (
              <>
                <FilterMenu
                  glass={floating}
                  multiple
                  label={jobTypes.length === 0 ? 'Hình thức' : jobTypes.length === 1 ? (JOB_TYPES.find((t) => t.value === jobTypes[0])?.label ?? 'Hình thức') : `Hình thức · ${jobTypes.length}`}
                  active={typesChanged}
                  options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  selected={jobTypes}
                  onSelect={(v) => toggleType(v as JobType)}
                  footer={{ label: 'Theo hồ sơ', onClick: () => setJobTypes(base.jobTypes) }}
                />
                <FilterMenu
                  glass={floating}
                  label={`Lương ${formatHourlyFromK(salaryMinK)}`}
                  active={salaryMinK !== base.salaryMinK}
                  options={[
                    { value: String(base.salaryMinK), label: `Theo hồ sơ · ${formatHourlyFromK(base.salaryMinK)}` },
                    ...SALARY_STEPS.filter((k) => k !== base.salaryMinK).map((k) => ({ value: String(k), label: formatHourlyFromK(k).replace(/^t/, 'T') })),
                  ]}
                  selected={[String(salaryMinK)]}
                  onSelect={(v) => setSalaryMinK(Number(v))}
                />
                <FilterMenu
                  glass={floating}
                  label={`Trong ${maxDistanceKm} km`}
                  active={maxDistanceKm !== base.maxDistanceKm}
                  options={[
                    { value: String(base.maxDistanceKm), label: `Theo hồ sơ · ${base.maxDistanceKm} km` },
                    ...DISTANCE_STEPS.filter((km) => km !== base.maxDistanceKm).map((km) => ({ value: String(km), label: `Trong ${km} km` })),
                  ]}
                  selected={[String(maxDistanceKm)]}
                  onSelect={(v) => setMaxDistanceKm(Number(v))}
                />
                <LevelMenu glass={floating} scores={current.map((x) => x.outcome.score)} value={level} onChange={setLevel} />
                {dirty && (
                  <ChipReset glass={floating} onClick={clearFilters}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Đặt lại
                  </ChipReset>
                )}
              </>
            )}
          />

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
            {waiting ? (
              <SkeletonCards count={3} className="mx-auto max-w-3xl space-y-4" label="Đang tải việc phù hợp…" />
            ) : shown.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={
                  query && lists[tab].length > 0 && current.length === 0
                    ? 'Không có việc nào khớp từ khóa'
                    : current.length > 0
                    ? 'Không có việc ở mức này'
                    : tab === 'fit' ? 'Chưa có việc nào' : tab === 'saved' ? 'Chưa lưu việc nào' : tab === 'applied' ? 'Chưa ứng tuyển việc nào' : 'Chưa có kết nối nào'
                }
                description={
                  query && lists[tab].length > 0 && current.length === 0
                    ? 'Thử gõ tên việc hoặc công ty khác, hoặc xóa ô tìm.'
                    : current.length > 0
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
              <ul ref={flipRef} className="mx-auto max-w-3xl space-y-4">
                {shown.map(({ job, outcome }) => (
                  <li key={job.id} data-flip-key={job.id}>
                    <JobCard job={job} outcome={outcome} actions={jobActions(job)} />
                  </li>
                ))}
              </ul>
            )}
          </Tabs>
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
            {base.skills.map((s) => (
              <li key={s} className="rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-page-fg">
            Lịch rảnh <span className="font-normal text-page-muted">· {base.slots.length} ca/tuần</span>
          </h3>
          {/* Lưới chỉ xem: hàng = buổi, cột = ngày; ô đặc = rảnh */}
          <div className="mt-2 grid grid-cols-[auto_repeat(7,1fr)] items-center gap-1 text-xs text-page-muted" role="img"
            aria-label={`Lịch rảnh ${base.slots.length} ca mỗi tuần`}>
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
                    className={cn('h-4 rounded-[6px] border', base.slots.includes(`${di}-${si}`) ? 'border-page-fg bg-page-fg' : 'border-page-line')}
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
                  className={cn(CHIP, 'gap-1 px-3 py-1.5 text-xs', on ? CHIP_ON : CHIP_OFF)}>
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
              { ...base, salaryMinK, maxDistanceKm, jobTypes, skills: [...base.skills, ...missing] },
              job,
              job.distanceKm,
              customPriority ? priority : undefined,
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
          <div className="mt-8"><ReportButton target="job" targetId={job.id} name={job.title} /></div>
        </MatchDetail>
      )
    })()}
    </>
  )
}
