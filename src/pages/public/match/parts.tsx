// Mảnh dùng chung của trang /match: khung trang, tabs, hàng ✓/✗, thẻ vị trí, vòng chữ tắt.
// Trang yên tĩnh như dashboard: không chuyển động cuộn, chỉ đổi màu viền/nền khi hover.
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowDownRight, Check, LayoutGrid, List, X } from 'lucide-react'
import MatchScore from '@components/dashboard/MatchScore'
import { Initials } from '@components/discover/detail/DetailBlocks'
import CompanyLogo from '@components/common/CompanyLogo'
import type { MatchView } from '@context/matchStore'
import { cn } from '@utils/cn'
import { CHIP } from '@utils/ui'
import PageCover, { COVER_GLASS, DarkPageBody } from '@components/common/PageCover'
import { CRITERION_LABELS, type CriterionResult, type MatchOutcome } from './score'
import { companyOf, type MatchJob } from './data'

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
export function MatchFrame({ title, intro, search, children }: { title: string; intro: string; search?: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageCover level="md" title={title} lead={intro}>
        {search}
      </PageCover>
      <DarkPageBody>
        <section className="shell py-section-sm" aria-label="Kết quả kết nối">
          {children}
        </section>
      </DarkPageBody>
    </>
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
              {t.label} (<span className="tnum">{t.count}</span>)
            </button>
          )
        })}
      </div>
      {toolbar}
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
          <h3 className="font-display text-lg font-medium text-page-fg">
            {job.title} <span className="font-normal text-page-muted">· {company.name}</span>
          </h3>
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

/** Tiêu đề + điểm + mũi tên, phụ đề, rồi đường kẻ dưới. Nằm trong nút của thẻ nên chỉ dùng thẻ span. */
export function GalleryCaption({ title, subtitle, score, chip }: { title: string; subtitle: string; score: number; chip?: string }) {
  return (
    <span className="block border-b border-page-line pb-4">
      <span className="flex items-baseline justify-between gap-4">
        <span className="font-display text-lg font-medium text-page-fg">{title}</span>
        <span className="flex shrink-0 items-center gap-1 text-page-fg">
          <span className="tnum text-sm">{Math.round(score)}%</span>
          <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-1 block text-sm text-page-muted">{subtitle}</span>
      {chip && <span className="mt-2 inline-block rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-fg">{chip}</span>}
    </span>
  )
}
