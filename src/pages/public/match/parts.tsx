// Mảnh dùng chung của trang /match: khung trang, tabs, hàng ✓/✗, thẻ vị trí, vòng chữ tắt.
// Trang yên tĩnh như dashboard: không chuyển động cuộn, chỉ đổi màu viền/nền khi hover.
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Check, Clock, LayoutGrid, List, MessageCircle, X } from 'lucide-react'
import MessageLink from '@components/messenger/MessageLink'
import MatchScore from '@components/dashboard/MatchScore'
import { Initials } from '@components/discover/detail/DetailBlocks'
import CompanyLogo from '@components/common/CompanyLogo'
import type { MatchView } from '@context/matchStore'
import { cn } from '@utils/cn'
import { BTN_PRIMARY, BTN_SECONDARY, CHIP } from '@utils/ui'
import PageCover, { COVER_EDGE, COVER_GLASS, DarkPageBody } from '@components/common/PageCover'
import { CRITERION_LABELS, type CriterionResult, type MatchOutcome } from './score'
import { companyOf, type MatchJob } from './data'
import { fitTone } from './gallery/MatchGallery'

/** Nút dùng chung — re-export từ bộ nút của site để các màn hình ngoài /match vẫn import được */
export { BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'

/** Chip/tab đang chọn trên nền xanh: nền ngà, chữ than chì (tab không phải hành động chính nên không dùng màu nhấn) */
/** Ban ngày: nền abyss, chữ day (index.css → .chip-inv) */
export const DARK_CHIP_ON = 'chip-inv font-medium'
/** Chip/tab chưa chọn: kính tối, chữ ngà */
export const DARK_CHIP_OFF = `${COVER_GLASS} chip-off-dark text-page-fg`

/**
 * Khung chung của /match: bìa xanh cấp md (tiêu đề + câu dẫn + `search` = thanh tìm / chọn vị trí / dòng tiêu chí)
 * rồi phần nội dung tối (DarkPageBody) chứa tab, chế độ xem và danh sách.
 */
export function MatchFrame({ title, intro, search, aside, children }: { title: string; intro: string; search?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    // .match-round: trang Kết nối bo góc thẻ lớn hơn phần còn lại của site (chủ dự án 2026-11-22) — index.css
    <div className="match-round">
      <PageCover level="md" centered title={title} lead={intro} aside={aside}>
        {search}
      </PageCover>
      <DarkPageBody>
        {/* Cùng lề ngang với bìa (COVER_EDGE) để tiêu đề, bộ lọc, tab và lưới thẳng một mép */}
        <section className={cn(COVER_EDGE, 'pb-10 pt-2 md:pb-12')} aria-label="Kết quả kết nối">
          {children}
        </section>
      </DarkPageBody>
    </div>
  )
}

/** Vòng chữ viết tắt (tên người hoặc tên công ty) — viền để tách khỏi nền thẻ */
export function Avatar({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded-full border border-page-line">
      <Initials text={text} />
    </span>
  )
}

/** Tên viết tắt của người: "Nguyễn T. H." → "NH" */
export function personInitials(name: string) {
  const parts = name.replace(/\./g, '').split(/\s+/).filter(Boolean)
  return (parts[0][0] + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

/** Chữ tắt công ty: hai chữ cuối của tên, "Quán Gió Sông Hàn" → "SH" */
export function companyInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  return words
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

export interface TabDef {
  id: string
  label: string
  count: number
}

/** Tabs chuẩn WAI-ARIA: mũi tên trái/phải, Home/End; chỉ tab đang chọn nằm trong thứ tự Tab. */
export function Tabs({
  idPrefix,
  label,
  tabs,
  value,
  onChange,
  center,
  toolbar,
  children,
}: {
  idPrefix: string
  label: string
  tabs: TabDef[]
  value: string
  onChange: (id: string) => void
  /** Căn giữa hàng tab */
  center?: boolean
  /** Hàng điều khiển nằm giữa tablist và tabpanel (không thuộc tabpanel) */
  toolbar?: ReactNode
  children: ReactNode
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.id === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <div>
      {/* Tab bên trái, công cụ (chế độ xem) bên phải; hẹp thì xuống dòng */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cn('flex flex-wrap gap-2', center && 'justify-center')}>
        {tabs.map((t) => {
          const on = t.id === value
          return (
            <button
              key={t.id}
              ref={(el) => (refs.current[t.id] = el)}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={cn(CHIP, 'min-h-11', on ? DARK_CHIP_ON : DARK_CHIP_OFF)}
            >
              {t.label}
              <span className="tnum rounded-full bg-[color-mix(in_srgb,currentColor_16%,transparent)] px-1.5 text-xs leading-5">{t.count}</span>
            </button>
          )
        })}
      </div>
      {toolbar}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${value}`} className="mt-6">
        {children}
      </div>
    </div>
  )
}

// ─── Hàng kiểm tra ✓/✗ ──────────────────────────────────────────────────────

/** Mỗi tiêu chí một dòng: biểu tượng + chữ (không dựa vào màu). `noteOf` cho phép đổi lời ghi chú theo phía xem. */
export function CheckList({
  results,
  missingSkills,
  noteOf = (r) => r.note,
}: {
  results: CriterionResult[]
  missingSkills: string[]
  noteOf?: (r: CriterionResult) => string
}) {
  return (
    <div className="mt-4">
      <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {results.map((r) => (
          <li key={r.key} className={cn('flex items-start gap-2', r.ok ? 'text-page-fg' : 'text-page-muted')}>
            {r.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              <span className="sr-only">
                {CRITERION_LABELS[r.key]}: {r.ok ? 'đạt' : 'chưa đạt'}.{' '}
              </span>
              {noteOf(r)}
            </span>
          </li>
        ))}
      </ul>
      {missingSkills.length > 0 && <p className="mt-2 text-sm text-page-muted">Thiếu: {missingSkills.join(', ')}</p>}
    </div>
  )
}

// ─── Thẻ vị trí ─────────────────────────────────────────────────────────────

/** Thẻ một vị trí tuyển dụng với điểm phù hợp; `actions` là hàng nút (khách xem thử thì để trống). */
export function JobCard({ job, outcome, actions }: { job: MatchJob; outcome: MatchOutcome; actions?: ReactNode }) {
  const company = companyOf(job.companyId)
  return (
    <article className={cn('h-full rounded-card p-5 md:p-6', COVER_GLASS)}>
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 sm:grid-cols-[auto_1fr_auto]">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} decorative />
        <div className="min-w-0">
          <h3 className="font-display text-lg font-medium text-page-fg">{job.title}</h3>
          <p className="text-sm text-page-muted">{company.name}</p>
          <p className="mt-1 text-sm text-page-muted">
            {job.district} · cách {job.distanceKm} km · {job.salaryLabel} · {job.shiftLabel}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <MatchScore score={outcome.score} />
        </div>
      </div>
      <CheckList results={outcome.results} missingSkills={outcome.missingSkills} />
      {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
    </article>
  )
}

// ─── Chế độ xem Danh sách / Bộ sưu tập ──────────────────────────────────────

/** Bỏ dấu + chữ thường để gõ "pha che" vẫn ra "Pha chế" */
export const foldText = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

/** Mọi từ trong `query` đều có mặt trong `haystack` (đã bỏ dấu). Query trống = khớp. */
export const foldMatches = (haystack: string[], query: string) => {
  const hay = foldText(haystack.join(' '))
  return foldText(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
}

/** Nhóm hai nút chuyển chế độ xem */
export function ViewToggle({ value, onChange }: { value: MatchView; onChange: (v: MatchView) => void }) {
  const options: { id: MatchView; label: string; Icon: typeof List }[] = [
    { id: 'list', label: 'Danh sách', Icon: List },
    { id: 'gallery', label: 'Bộ sưu tập', Icon: LayoutGrid },
  ]
  return (
    <div role="group" aria-label="Chế độ xem" className="flex gap-1">
      {options.map(({ id, label, Icon }) => {
        const on = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={cn(CHIP, 'min-h-11', on ? DARK_CHIP_ON : DARK_CHIP_OFF)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Lọc theo mức phù hợp ───────────────────────────────────────────────────

export type LevelKey = 'all' | 'high' | 'good' | 'maybe' | 'low'

/** Mức theo ngưỡng điểm, khớp nhãn của MatchScore (≥80 / ≥60 / ≥40 / dưới 40) */
export const LEVELS: { id: LevelKey; label: string; has: (score: number) => boolean }[] = [
  { id: 'all', label: 'Tất cả', has: () => true },
  { id: 'high', label: 'Rất phù hợp', has: (s) => s >= 80 },
  { id: 'good', label: 'Phù hợp', has: (s) => s >= 60 && s < 80 },
  { id: 'maybe', label: 'Có thể phù hợp', has: (s) => s >= 40 && s < 60 },
  { id: 'low', label: 'Ít phù hợp', has: (s) => s < 40 },
]

/** Giữ lại các mục thuộc mức đã chọn */
export function filterByLevel<T>(items: T[], level: LevelKey, scoreOf: (item: T) => number) {
  const def = LEVELS.find((l) => l.id === level) ?? LEVELS[0]
  return items.filter((x) => def.has(scoreOf(x)))
}

// ─── Chữ dưới ảnh của Bộ sưu tập ────────────────────────────────────────────

/** Vòng tròn điểm phù hợp 52px: nền page-line, cung màu theo mức (fitTone), số % ở giữa. Không có chuyển động. */
export function ScoreRing({ value }: { value: number }) {
  const tone = fitTone(value)
  const size = 52
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Độ phù hợp ${value}%, ${tone.label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-page-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className={tone.stroke}
        />
      </svg>
      <span aria-hidden="true" className={cn('tnum absolute inset-0 flex items-center justify-center text-xs font-semibold', tone.text)}>
        {value}%
      </span>
    </span>
  )
}

/**
 * Thân thẻ Bộ sưu tập: tiêu đề + dòng phụ (trái) và vòng điểm phù hợp (phải), ca làm, đúng MỘT dòng lý do
 * (✗ điều thiếu quan trọng nhất nếu có, không thì ✓ tốt nhất đầu danh sách `reasons`).
 * Nằm trong nút của thẻ nên chỉ dùng thẻ span.
 */
export function GalleryCaption({
  title,
  subtitle,
  meta,
  score,
  reasons,
  missing,
}: {
  title: string
  subtitle: string
  /** Ca làm / thời gian (có biểu tượng đồng hồ) */
  meta?: string
  score: number
  /** Các lý do đạt, đã xếp theo độ quan trọng; chỉ phần tử đầu được hiện (khi không có `missing`) */
  reasons?: string[]
  /** Một điều quan trọng nhất còn thiếu (✗: chỉ biểu tượng màu danger, chữ mờ-đậm) */
  missing?: string
}) {
  const value = Math.round(Math.min(100, Math.max(0, score)))
  const best = reasons?.[0]
  return (
    <span className="flex flex-1 flex-col">
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-display text-base font-semibold leading-snug text-page-fg">{title}</span>
          <span className="mt-0.5 block text-sm text-page-muted">{subtitle}</span>
        </span>
        <ScoreRing value={value} />
      </span>
      {meta && (
        <span className="mt-2 flex items-center gap-1.5 text-sm text-page-fg">
          <Clock className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
          {meta}
        </span>
      )}
      {(missing || best) && (
        <span className="mt-2 flex text-sm leading-normal">
          {missing ? (
            <span className="inline-flex items-center gap-1.5 text-page-muted">
              <X className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              <span className="sr-only">Chưa đạt: </span>
              {missing}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-page-fg">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              {best}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

/**
 * Nút hành động đáy thẻ Bộ sưu tập (toàn chiều rộng, cao 44px), theo trạng thái ghép cặp:
 * chưa có → nút đặc; đối phương đã quan tâm → nút đặc "Đồng ý kết nối"; đã gửi → nút khóa; đã kết nối → "Nhắn tin".
 * Cùng hành động với hàng nút của chế độ Danh sách (`onPrimary` = expressInterest).
 */
export function GalleryAction({
  status,
  name,
  convKey,
  onPrimary,
  labels,
}: {
  status: string
  /** Tên vị trí / ứng viên, chỉ cho trình đọc màn hình */
  name: string
  convKey: string
  onPrimary: () => void
  labels: { none: string; sent: string }
}) {
  const full = 'w-full min-h-11'
  if (status === 'connected') {
    return (
      <MessageLink convKey={convKey} className={cn(BTN_SECONDARY, full)}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Nhắn tin<span className="sr-only"> {name}</span>
      </MessageLink>
    )
  }
  if (status === 'sent') {
    return (
      <button type="button" disabled className={cn(BTN_SECONDARY, full, 'text-page-muted disabled:opacity-100')}>
        <Check className="h-4 w-4" aria-hidden="true" />
        {labels.sent}<span className="sr-only"> {name}</span>
      </button>
    )
  }
  return (
    <button type="button" onClick={onPrimary} className={cn(BTN_PRIMARY, full)}>
      {status === 'received' ? 'Đồng ý kết nối' : labels.none}<span className="sr-only"> {name}</span>
    </button>
  )
}

/** Các lý do đạt (✓) của một kết quả chấm điểm, dùng cho GalleryCaption */
export const okReasons = (results: CriterionResult[], noteOf: (r: CriterionResult) => string = (r) => r.note) =>
  results.filter((r) => r.ok).slice(0, 3).map(noteOf)

const commaDecimal = (t: string) => t.replace(/(\d)\.(\d)/g, '$1,$2')

/**
 * Lý do hiển thị trên thẻ Bộ sưu tập của người tìm việc: các ✓ (chữ ngắn gọn, xếp theo ưu tiên hiển thị) + 1 ✗ cho tiêu chí thiếu quan trọng nhất
 * (lịch rảnh > kỹ năng > khoảng cách > lương > loại việc). Chỉ đổi cách đọc, không đổi điểm.
 */
export function fitReasons(outcome: MatchOutcome): { ok: string[]; missing?: string } {
  const by = (k: CriterionResult['key']) => outcome.results.find((r) => r.key === k)
  const ok: string[] = []
  // Thứ tự = độ ưu tiên hiển thị: lịch rảnh, khoảng cách, kỹ năng, lương, loại việc (thẻ chỉ hiện lý do đầu tiên)
  const schedule = by('schedule')
  if (schedule?.ok) ok.push(schedule.note)
  const distance = by('distance')
  if (distance?.ok) ok.push(commaDecimal(distance.note))
  const skills = by('skills')
  if (skills && (skills.ok || skills.value > 0)) ok.push(`Có ${skills.note.replace(/^Thiếu.*$/, '').trim() || ''}`.trim())
  if (by('salary')?.ok) ok.push('Lương hợp')
  if (by('jobType')?.ok) ok.push('Đúng loại việc')

  let missing: string | undefined
  if (schedule && !schedule.ok) missing = commaDecimal(schedule.note.replace(/^Rảnh /, 'Chỉ rảnh '))
  else if (skills && !skills.ok) {
    const names = outcome.missingSkills
    missing = names.length ? `Thiếu kỹ năng ${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''}` : 'Thiếu kỹ năng'
  } else if (distance && !distance.ok) missing = commaDecimal(distance.note)
  else if (by('salary') && !by('salary')!.ok) missing = 'Lương thấp hơn mong muốn'
  else if (by('jobType') && !by('jobType')!.ok) missing = 'Khác loại việc'
  return { ok: ok.filter((t) => t !== 'Có').slice(0, 3), missing }
}
