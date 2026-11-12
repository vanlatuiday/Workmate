import { useMemo, useState } from 'react'
import { notifySuccess } from '@utils/feedback'
import { Bookmark, BookmarkCheck, MapPin, Search, UserSearch } from 'lucide-react'
import { EmptyState, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { candidateKey, useMatchStore } from '@context/matchStore'
import { availabilityLabel, useCandidates, usePositions, type MatchCandidate, type MatchPosition } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { expressInterest, useOnNewConnection, usePairStatuses, type PairStatus } from '@services/connectionService'
import { useFlip } from '@hooks/useFlip'
import PopIcon from '@components/common/PopIcon'
import { useQueryParam } from '@hooks/useQueryParam'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'
import { candidateHref } from '@pages/public/personal/links'
import { Link } from 'react-router-dom'

const FIELD = `h-10 rounded-control border border-page-edge bg-page-surface px-3 text-sm text-page-fg ${FOCUS}`

/** Bỏ dấu + chữ thường để "pha che" khớp "Pha chế" */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim()
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

const SESSIONS = [
  { id: 0, label: 'Sáng' },
  { id: 1, label: 'Chiều' },
  { id: 2, label: 'Tối' },
]
const SALARY_CAPS = [30, 35, 40, 50]

/** Ca rảnh có dạng `${ngày}-${buổi}` */
const freeIn = (c: MatchCandidate, session: number) => c.criteria.slots.some((s) => s.endsWith(`-${session}`))

const STATUS_LABEL: Record<Exclude<PairStatus, 'none'>, string> = {
  sent: 'Đã quan tâm',
  received: 'Ứng viên quan tâm tin này',
  connected: 'Đã kết nối',
}

function CandidateCard({ c, positions }: { c: MatchCandidate; positions: MatchPosition[] }) {
  const statusOf = usePairStatuses('recruiter')
  const savedCandidates = useMatchStore((s) => s.savedCandidates)
  const toggleSaved = useMatchStore((s) => s.toggleSavedCandidate)
  const [open, setOpen] = useState(false)

  // Tin hợp nhất với ứng viên này
  const scored = positions.map((p) => ({ p, score: scoreMatch(c.criteria, p.req, c.distanceKm).score })).sort((a, b) => b.score - a.score)
  const best = scored[0]
  const states = positions.map((p) => ({ p, st: statusOf(p.id, c.id) }))
  // Chỉ chọn được tin chưa quan tâm / chưa kết nối; mặc định tin hợp nhất trong số đó
  const choosable = scored.filter(({ p }) => ['none', 'received'].includes(statusOf(p.id, c.id)))
  const [picked, setPicked] = useState(choosable[0]?.p.id ?? best.p.id)
  const pickedId = choosable.some(({ p }) => p.id === picked) ? picked : choosable[0]?.p.id

  const key = candidateKey(best.p.id, c.id)
  const isSaved = savedCandidates.includes(key)
  const ready = c.availability.kind === 'ready'

  const send = () => {
    if (!pickedId) return
    // Phản hồi thành công do expressInterest (connectionService) báo
    expressInterest('recruiter', pickedId, c.id)
    setOpen(false)
  }

  return (
    <li data-flip-key={c.id} className="flex min-w-0 flex-col rounded-card border border-page-line bg-page-surface p-5">
      {/* flex-wrap: màn hẹp thì nhãn "Bắt đầu…" xuống dòng thay vì đẩy thẻ tràn ngang */}
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-page-line font-display text-sm font-medium text-page-fg" aria-hidden="true">
          {initialsOf(c.name)}
        </span>
        <div className="min-w-0 flex-1 basis-40">
          <Link to={candidateHref(c.id)} className={`font-medium text-page-fg underline-offset-4 hover:underline ${FOCUS}`}>{c.name}</Link>
          <p className="mt-0.5 text-sm text-page-muted">{c.summary}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-page-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {c.area} · cách {c.distanceKm} km
          </p>
        </div>
        <StatusBadge tone={ready ? 'default' : 'muted'}>
          {availabilityLabel(c.availability)}
        </StatusBadge>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Kỹ năng">
        {c.criteria.skills.map((s) => (
          <li key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{s}</li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-page-fg">
        <span className="text-page-muted">Hợp nhất: </span>
        {best.p.job.title} · <span className="tnum font-medium">{best.score}%</span>
      </p>

      {states.some((x) => x.st !== 'none') && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Trạng thái theo tin">
          {states.filter((x) => x.st !== 'none').map(({ p, st }) => (
            <li key={p.id} className="min-w-0 max-w-full">
              {/* Tên tin dài: cho xuống dòng thay vì tràn khỏi thẻ ở màn hẹp */}
              <StatusBadge tone={st === 'connected' ? 'accent' : 'soft'} className="whitespace-normal break-words">
                {p.job.title}: {STATUS_LABEL[st as Exclude<PairStatus, 'none'>]}
              </StatusBadge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        {open && pickedId && (
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-card border border-page-line p-3">
            <label className="min-w-0 flex-1 text-xs text-page-muted">
              Chọn tin tuyển dụng
              <select value={pickedId} onChange={(e) => setPicked(e.target.value)} className={cn(FIELD, 'mt-1 w-full')}>
                {choosable.map(({ p, score }) => (
                  <option key={p.id} value={p.id}>{p.job.title} · {score}%</option>
                ))}
              </select>
            </label>
            <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={send}>Gửi quan tâm</button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {pickedId && (
            <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              Quan tâm…
            </button>
          )}
          <button
            type="button"
            className={cn(BTN_SECONDARY, BTN_SM)}
            aria-pressed={isSaved}
            onClick={() => {
              toggleSaved(key)
            }}
          >
            <PopIcon icon={isSaved ? BookmarkCheck : Bookmark} on={isSaved} fill={false} />
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </button>
        </div>
      </div>
    </li>
  )
}

/** Tìm ứng viên: duyệt toàn bộ ứng viên, lọc theo tên/kỹ năng/khu vực/ca rảnh/lương, quan tâm theo từng tin. */
export default function FindCandidates() {
  const [q, setQ] = useQueryParam('q')
  const [area, setArea] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [sessions, setSessions] = useState<number[]>([])
  const [salaryCap, setSalaryCap] = useState(0)
  // Máy chủ đã lọc người bị khóa và hồ sơ không cho phép tiếp cận
  const ALL_CANDIDATES = useCandidates()
  const positions = usePositions()
  const ALL_SKILLS = useMemo(() => [...new Set(ALL_CANDIDATES.flatMap((c) => c.criteria.skills))].sort((a, b) => a.localeCompare(b, 'vi')), [ALL_CANDIDATES])
  const AREAS = useMemo(() => [...new Set(ALL_CANDIDATES.map((c) => c.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [ALL_CANDIDATES])

  useOnNewConnection((c) => {
    const cand = ALL_CANDIDATES.find((x) => x.id === c.seekerId)
    if (cand) notifySuccess('Đã kết nối — giờ hai bên nhắn tin được')
  })

  const list = useMemo(() => {
    const nq = norm(q)
    return ALL_CANDIDATES.filter(
      (c) =>
        (!nq || norm(c.name).includes(nq) || c.criteria.skills.some((s) => norm(s).includes(nq)) || norm(c.summary).includes(nq)) &&
        (!area || c.area === area) &&
        skills.every((s) => c.criteria.skills.includes(s)) &&
        sessions.every((s) => freeIn(c, s)) &&
        (!salaryCap || c.criteria.salaryMinK <= salaryCap),
    )
  }, [ALL_CANDIDATES, q, area, skills, sessions, salaryCap])

  const flipRef = useFlip<HTMLUListElement>(list.map((c) => c.id))
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const hasFilter = !!(q || area || skills.length || sessions.length || salaryCap)
  const reset = () => {
    setQ('')
    setArea('')
    setSkills([])
    setSessions([])
    setSalaryCap(0)
  }
  const chip = (on: boolean) => cn(CHIP, on ? CHIP_ON : CHIP_OFF)

  return (
    <div>
      <PageHeader title="Tìm ứng viên" description="Duyệt toàn bộ ứng viên, rồi quan tâm theo đúng tin tuyển dụng bạn muốn." />

      <Panel className="mb-6">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <span className="sr-only">Tìm theo tên hoặc kỹ năng</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc kỹ năng"
              className={cn(FIELD, 'w-full pl-9')}
            />
          </label>
          <label>
            <span className="sr-only">Khu vực</span>
            <select value={area} onChange={(e) => setArea(e.target.value)} className={cn(FIELD, 'w-full')}>
              <option value="">Mọi khu vực</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Lương mong muốn tối đa</span>
            <select value={salaryCap} onChange={(e) => setSalaryCap(Number(e.target.value))} className={cn(FIELD, 'w-full')}>
              <option value={0}>Mọi mức lương</option>
              {SALARY_CAPS.map((v) => <option key={v} value={v}>Mong muốn tới {v}.000đ/giờ</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Rảnh buổi">
          <span className="mr-1 text-xs text-page-muted">Rảnh buổi</span>
          {SESSIONS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sessions.includes(s.id)} className={chip(sessions.includes(s.id))} onClick={() => setSessions((v) => toggle(v, s.id))}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Kỹ năng">
          <span className="mr-1 text-xs text-page-muted">Kỹ năng</span>
          {ALL_SKILLS.map((s) => (
            <button key={s} type="button" aria-pressed={skills.includes(s)} className={chip(skills.includes(s))} onClick={() => setSkills((v) => toggle(v, s))}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-page-muted" aria-live="polite">
          <span>{list.length} ứng viên</span>
          {hasFilter && <button type="button" onClick={reset} className={cn('rounded-control underline underline-offset-4 transition-colors duration-fast hover:text-page-fg', FOCUS)}>Xóa bộ lọc</button>}
        </div>
      </Panel>

      {positions.length === 0 ? (
        <EmptyState icon={Search} title="Chưa có tin đang hiển thị" description="Cần có tin đang mở đã được duyệt để quan tâm ứng viên." />
      ) : list.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="Không có ứng viên phù hợp"
          description="Thử bỏ bớt điều kiện lọc."
          action={<button type="button" onClick={reset} className={cn(BTN_PRIMARY, BTN_SM)}>Xóa bộ lọc</button>}
        />
      ) : (
        <ul ref={flipRef} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => <CandidateCard key={c.id} c={c} positions={positions} />)}
        </ul>
      )}

    </div>
  )
}
