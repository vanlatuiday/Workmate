import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, X, ChevronDown, Heart, Bookmark, EyeOff, Undo2, MapPin, CalendarCheck, Wallet, Users, MessageCircle } from 'lucide-react'
import { PageHeader, Panel, StatusBadge, MatchScore, EmptyState, MockNotice } from '@components/dashboard'
import { cn } from '@utils/cn'
import { MOCK_JOBS, MOCK_CANDIDATES, CRITERIA, type MockCandidate } from './mockData'
import { FOCUS } from '@utils/focus'

const BTN = `inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${FOCUS}`
const BTN_OUTLINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`
const BTN_ON = `${BTN} border-page-fg bg-page-fg text-page-bg`

export default function SuggestedCandidates() {
  // Dữ liệu mẫu — thay bằng API. Mọi thao tác chỉ đổi state cục bộ.
  const [params, setParams] = useSearchParams()
  const paramJob = params.get('job')
  // Tin nháp chưa có ứng viên gợi ý nên không đưa vào select
  const selectable = MOCK_JOBS.filter((j) => j.status !== 'draft')
  const jobId = selectable.some((j) => j.id === paramJob) ? (paramJob as string) : selectable[0].id

  const [interested, setInterested] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Set<string>>(new Set())
  // Ứng viên vừa bỏ qua: hiện dòng thông báo + Hoàn tác ngay đầu danh sách
  const [lastSkipped, setLastSkipped] = useState<MockCandidate | null>(null)
  const [statusText, setStatusText] = useState('')
  const [statusTick, setStatusTick] = useState(0)
  const statusRef = useRef<HTMLParagraphElement>(null)

  // Thẻ bị gỡ khỏi danh sách nên đưa focus tới dòng thông báo để người dùng bàn phím không rơi về body
  useEffect(() => {
    if (statusTick > 0) statusRef.current?.focus()
  }, [statusTick])

  const skip = (c: MockCandidate) => {
    setSkipped((s) => flip(s, c.id))
    setLastSkipped(c)
    setStatusText(`Đã bỏ qua ${c.name}.`)
    setStatusTick((n) => n + 1)
  }
  const undo = (c: MockCandidate) => {
    setSkipped((s) => flip(s, c.id))
    setLastSkipped(null)
    setStatusText(`Đã hoàn tác, ${c.name} trở lại danh sách.`)
    setStatusTick((n) => n + 1)
  }

  const flip = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const all = MOCK_CANDIDATES.filter((c) => c.jobId === jobId).sort((a, b) => b.score - a.score)
  const visible = all.filter((c) => !skipped.has(c.id))
  const hidden = all.filter((c) => skipped.has(c.id))

  const card = (c: MockCandidate) => {
    const isInterested = interested.has(c.id)
    const isMatch = isInterested && c.interestedBefore
    const isOpen = open.has(c.id)
    const detailId = `detail-${c.id}`
    return (
      <li key={c.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-page-line font-display text-lg text-page-fg"
            >
              {c.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-medium text-page-fg">{c.name}</h2>
                {isMatch && <StatusBadge tone="strong">MATCH</StatusBadge>}
                {!isMatch && c.interestedBefore && <StatusBadge tone="default">Đã quan tâm tin của bạn</StatusBadge>}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-page-muted">
                <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{c.area} · <span className="tnum">{c.distanceKm.toLocaleString('vi-VN')} km</span></li>
                <li className="flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />Khớp <span className="tnum">{c.matchedShifts}/{c.totalShifts}</span> ca</li>
                <li className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" aria-hidden="true" />Mong muốn {c.expectedSalary}</li>
              </ul>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Kỹ năng">
                {c.skills.map((s) => (
                  <li key={s} className="rounded-full border border-page-line px-3 py-1 text-xs text-page-fg">{s}</li>
                ))}
              </ul>
            </div>
          </div>
          {/* Mobile: thanh điểm rộng hết thẻ; từ md giữ độ rộng cố định của MatchScore */}
          <div className="[&>div]:w-full md:[&>div]:w-40">
            <MatchScore score={c.score} />
          </div>
        </div>

        {/* Tiêu chí bắt buộc: icon + chữ, không chỉ màu */}
        <ul className="mt-4 grid gap-1.5 sm:grid-cols-3" aria-label="Tiêu chí bắt buộc">
          {c.mandatory.map((m) => (
            <li key={m.label} className="flex items-start gap-1.5 text-xs text-page-fg">
              {m.ok ? (
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              ) : (
                <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-page-muted" aria-hidden="true" />
              )}
              <span className={m.ok ? '' : 'text-page-muted'}>
                {m.label}: <strong className="font-medium">{m.ok ? 'đạt' : 'không đạt'}</strong>
              </span>
            </li>
          ))}
        </ul>

        <div id={detailId} hidden={!isOpen} className="mt-4 border-t border-page-line pt-4">
          {isOpen && (<>
            <p className="mb-3 text-xs text-page-muted">Phân rã 7 tiêu chí</p>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {CRITERIA.map(({ key, label }) => (
                <li key={key} role="img" aria-label={`${label}: ${c.breakdown[key]}%`}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-page-fg">{label}</span>
                    <span className="tnum text-page-muted">{c.breakdown[key]}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-page-line" aria-hidden="true">
                    <div className="h-full rounded-full bg-page-fg" style={{ width: `${c.breakdown[key]}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </>)}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isMatch ? (
            <>
              <StatusBadge tone="strong">MATCH — đã mở chat</StatusBadge>
              <Link to="/tuyen-dung/tin-nhan" className={BTN_OUTLINE}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Mở tin nhắn
              </Link>
              <button type="button" onClick={() => setInterested((s) => flip(s, c.id))} className={BTN_OUTLINE}>
                <Heart className="h-4 w-4" aria-hidden="true" />
                Bỏ quan tâm<span className="sr-only"> {c.name}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-pressed={isInterested}
              onClick={() => setInterested((s) => flip(s, c.id))}
              className={isInterested ? BTN_ON : BTN_OUTLINE}
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {isInterested ? 'Đã quan tâm' : 'Quan tâm'}<span className="sr-only"> {c.name}</span>
            </button>
          )}
          <button
            type="button"
            aria-pressed={saved.has(c.id)}
            onClick={() => setSaved((s) => flip(s, c.id))}
            className={saved.has(c.id) ? BTN_ON : BTN_OUTLINE}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {saved.has(c.id) ? 'Đã lưu' : 'Lưu'}<span className="sr-only"> {c.name}</span>
          </button>
          <button type="button" onClick={() => skip(c)} className={BTN_OUTLINE}>
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            Bỏ qua<span className="sr-only"> {c.name}</span>
          </button>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={detailId}
            onClick={() => setOpen((s) => flip(s, c.id))}
            className={`${BTN_OUTLINE} md:ml-auto`}
          >
            {isOpen ? 'Ẩn chi tiết' : 'Xem chi tiết điểm'}<span className="sr-only"> {c.name}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isOpen && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ứng viên phù hợp"
        description="Hệ thống gợi ý ứng viên theo từng tin tuyển dụng, sắp theo điểm phù hợp."
      />
      <MockNotice />

      <Panel>
        <label htmlFor="job-select" className="text-sm text-page-muted">Tin tuyển dụng</label>
        <select
          id="job-select"
          value={jobId}
          onChange={(e) => setParams({ job: e.target.value })}
          className={`mt-2 block w-full rounded-card border border-page-edge bg-page-surface px-4 py-3 text-sm text-page-fg md:max-w-md ${FOCUS}`}
        >
          {selectable.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-page-muted">
          MATCH là hai chiều: khi bạn quan tâm một ứng viên và họ cũng đã quan tâm tin của bạn, chat được mở và
          thông tin liên hệ mới hiện ra. Trước đó bạn chỉ thấy tên viết tắt.
        </p>
      </Panel>

      {/* Thông báo ngay đầu danh sách: vừa báo kết quả vừa cho Hoàn tác gần chỗ bấm */}
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="flex flex-wrap items-center gap-3 text-sm text-page-fg focus:outline-none empty:hidden"
      >
        {statusText}
        {lastSkipped && skipped.has(lastSkipped.id) && (
          <button type="button" onClick={() => undo(lastSkipped)} className={BTN_OUTLINE}>
            <Undo2 className="h-4 w-4" aria-hidden="true" />
            Hoàn tác
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có ứng viên phù hợp"
          description={hidden.length ? 'Bạn đã bỏ qua tất cả ứng viên của tin này. Hoàn tác bên dưới nếu cần.' : 'Khi có hồ sơ khớp với tin này, ứng viên sẽ xuất hiện ở đây.'}
        />
      ) : (
        <ul className="space-y-4">{visible.map(card)}</ul>
      )}

      {hidden.length > 0 && (
        <Panel title={`Đã bỏ qua (${hidden.length})`}>
          <ul className="divide-y divide-page-line">
            {hidden.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="text-sm text-page-fg">{c.name} · <span className="tnum text-page-muted">{c.score}%</span></span>
                <button type="button" onClick={() => undo(c)} className={BTN_OUTLINE}>
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Hoàn tác<span className="sr-only"> {c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
