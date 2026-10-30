import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bookmark, BookmarkCheck, MapPin, Search, UserSearch } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { candidateKey, useMatchStore } from '@context/matchStore'
import { useDemoStore } from '@context/demoStore'
import { useSettingsStore } from '@context/settingsStore'
import { CANDIDATES, isSeekerVisibleTo, ME_CANDIDATE, POSITIONS, type MatchCandidate } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { expressInterest, useOnNewConnection, usePairStatuses, type PairStatus } from '@services/connectionService'
import { useAdmin } from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const FIELD = `h-10 rounded-control border border-page-edge bg-page-surface px-3 text-sm text-page-fg ${FOCUS}`
const BTN = `inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/** Bỏ dấu + chữ thường để "pha che" khớp "Pha chế" */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim()
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

// Toàn bộ ứng viên: bỏ trùng theo tên (một người có thể hợp nhiều tin) + người tìm việc demo
const ALL_CANDIDATES: MatchCandidate[] = [
  ...CANDIDATES.filter((c, i, a) => a.findIndex((x) => norm(x.name) === norm(c.name)) === i),
  ME_CANDIDATE,
]
const ALL_SKILLS = [...new Set(ALL_CANDIDATES.flatMap((c) => c.criteria.skills))].sort((a, b) => a.localeCompare(b, 'vi'))
const AREAS = [...new Set(ALL_CANDIDATES.map((c) => c.area))].sort((a, b) => a.localeCompare(b, 'vi'))
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

function CandidateCard({ c }: { c: MatchCandidate }) {
  const statusOf = usePairStatuses('recruiter')
  const savedCandidates = useMatchStore((s) => s.savedCandidates)
  const toggleSaved = useMatchStore((s) => s.toggleSavedCandidate)
  const [open, setOpen] = useState(false)

  // Tin hợp nhất với ứng viên này
  const scored = POSITIONS.map((p) => ({ p, score: scoreMatch(c.criteria, p.req, c.distanceKm).score })).sort((a, b) => b.score - a.score)
  const best = scored[0]
  const states = POSITIONS.map((p) => ({ p, st: statusOf(p.id, c.id) }))
  // Chỉ chọn được tin chưa quan tâm / chưa kết nối; mặc định tin hợp nhất trong số đó
  const choosable = scored.filter(({ p }) => ['none', 'received'].includes(statusOf(p.id, c.id)))
  const [picked, setPicked] = useState(choosable[0]?.p.id ?? best.p.id)
  const pickedId = choosable.some(({ p }) => p.id === picked) ? picked : choosable[0]?.p.id

  const key = candidateKey(best.p.id, c.id)
  const isSaved = savedCandidates.includes(key)
  const ready = c.availability.kind === 'ready'

  const send = () => {
    if (!pickedId) return
    const title = POSITIONS.find((p) => p.id === pickedId)?.job.title
    const connecting = statusOf(pickedId, c.id) === 'received'
    expressInterest('recruiter', pickedId, c.id)
    if (!connecting) toast.success(`Đã quan tâm ${c.name} — ${title}`)
    setOpen(false)
  }

  return (
    <li className="flex flex-col rounded-card border border-page-line bg-page-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-page-line font-display text-sm font-medium text-page-fg" aria-hidden="true">
          {initialsOf(c.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-page-fg">{c.name}</p>
          <p className="mt-0.5 text-sm text-page-muted">{c.summary}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-page-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {c.area} · cách {c.distanceKm} km
          </p>
        </div>
        <StatusBadge tone={ready ? 'default' : 'muted'}>
          {c.availability.kind === 'ready' ? `Sẵn sàng từ ${c.availability.from}` : 'Đang đi làm'}
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
            <li key={p.id}>
              <StatusBadge tone={st === 'connected' ? 'strong' : 'default'}>
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
            <button type="button" className={BTN_SOLID} onClick={send}>Gửi quan tâm</button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {pickedId && (
            <button type="button" className={BTN_SOLID} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              Quan tâm…
            </button>
          )}
          <button
            type="button"
            className={BTN_LINE}
            aria-pressed={isSaved}
            onClick={() => {
              toggleSaved(key)
              toast(isSaved ? 'Đã bỏ lưu' : 'Đã lưu ứng viên')
            }}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </button>
        </div>
      </div>
    </li>
  )
}

/** Tìm ứng viên: duyệt toàn bộ ứng viên, lọc theo tên/kỹ năng/khu vực/ca rảnh/lương, quan tâm theo từng tin. */
export default function FindCandidates() {
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [sessions, setSessions] = useState<number[]>([])
  const [salaryCap, setSalaryCap] = useState(0)
  // Ứng viên bị quản trị viên khóa không hiện cho doanh nghiệp
  const lockedSeekers = useAdmin((s) => s.lockedSeekers)
  // Quyền riêng tư của người tìm việc demo: đổi cài đặt hoặc kết nối thì danh sách tính lại
  const seekerVisibility = useSettingsStore((s) => s.bySide.seeker.visibility)
  const connections = useDemoStore((s) => s.connections)

  useOnNewConnection((c) => {
    const cand = ALL_CANDIDATES.find((x) => x.id === c.seekerId)
    if (cand) toast.success(`Kết nối thành công với ${cand.name}`)
  })

  const list = useMemo(() => {
    const nq = norm(q)
    return ALL_CANDIDATES.filter(
      (c) =>
        !lockedSeekers[c.id] &&
        (c.id !== ME_CANDIDATE.id || isSeekerVisibleTo()) &&
        (!nq || norm(c.name).includes(nq) || c.criteria.skills.some((s) => norm(s).includes(nq))) &&
        (!area || c.area === area) &&
        skills.every((s) => c.criteria.skills.includes(s)) &&
        sessions.every((s) => freeIn(c, s)) &&
        (!salaryCap || c.criteria.salaryMinK <= salaryCap),
    )
  }, [q, area, skills, sessions, salaryCap, lockedSeekers, seekerVisibility, connections])

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const hasFilter = !!(q || area || skills.length || sessions.length || salaryCap)
  const reset = () => {
    setQ('')
    setArea('')
    setSkills([])
    setSessions([])
    setSalaryCap(0)
  }
  const chip = (on: boolean) =>
    cn(
      'rounded-full border px-3 py-1 text-xs transition-colors duration-300',
      on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
      FOCUS,
    )

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
          {hasFilter && <button type="button" onClick={reset} className={cn('rounded-control underline underline-offset-4 hover:text-page-fg', FOCUS)}>Xóa bộ lọc</button>}
        </div>
      </Panel>

      {list.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="Không có ứng viên phù hợp"
          description="Thử bỏ bớt điều kiện lọc."
          action={<button type="button" onClick={reset} className={BTN_SOLID}>Xóa bộ lọc</button>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => <CandidateCard key={c.id} c={c} />)}
        </ul>
      )}

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
