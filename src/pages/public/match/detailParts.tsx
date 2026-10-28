// Mảnh dựng nội dung khung chi tiết /match: ô thông tin nhanh, thanh tiêu chí, gợi ý, thẻ tag.
// Yên tĩnh như dashboard; riêng thanh tiêu chí có data-bar để MatchDetail cho chạy từ 0 khi khung mở xong.
import type { ReactNode } from 'react'
import { Check, Lightbulb, X, type LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'
import { CRITERION_LABELS, type CriterionKey, type CriterionResult } from './score'

/** Một khối trong cột nội dung: nhãn nhỏ in hoa rồi nội dung */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export interface Fact {
  icon: LucideIcon
  label: string
  value: ReactNode
}

/** Lưới 2×2 ô thông tin nhanh: nhãn nhỏ + giá trị chữ display, kèm icon */
export function FactTiles({ items }: { items: Fact[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <li key={label} className="min-w-0 rounded-card border border-page-line p-4">
          <p className="flex items-center gap-1.5 text-xs text-page-muted">
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {label}
          </p>
          <p className="mt-1.5 break-words font-display text-base font-medium leading-snug text-page-fg md:text-lg">{value}</p>
        </li>
      ))}
    </ul>
  )
}

/**
 * Mỗi tiêu chí một hàng: ✓/✗ + tên · thanh mảnh · ghi chú và trọng số.
 * Phần đầy của thanh vẽ bằng scaleX (origin-left) để animate không đụng layout;
 * `data-v` giữ giá trị đích cho MatchDetail.
 */
export function CriterionBars({
  results,
  weights,
  noteOf = (r) => r.note,
}: {
  results: CriterionResult[]
  weights: Record<CriterionKey, number>
  noteOf?: (r: CriterionResult) => string
}) {
  return (
    <ul className="space-y-3">
      {results.map((r) => (
        <li
          key={r.key}
          className={cn(
            'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,7.5rem)_1fr_minmax(0,10rem)]',
            r.ok ? 'text-page-fg' : 'text-page-muted',
          )}
        >
          <span className="flex items-center gap-2">
            {r.ok ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="sr-only">{r.ok ? 'Đạt: ' : 'Chưa đạt: '}</span>
            {CRITERION_LABELS[r.key]}
          </span>
          <span className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-page-line sm:order-none sm:col-span-1" aria-hidden="true">
            <span
              data-bar
              data-v={r.value}
              className="block h-full origin-left rounded-full bg-page-fg"
              style={{ transform: `scaleX(${r.value})` }}
            />
          </span>
          <span className="text-right">
            {noteOf(r)} <span className="tnum text-xs text-page-muted">· {weights[r.key]}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Khối gợi ý (bổ sung kỹ năng nào để lên bao nhiêu %, hoặc ứng viên còn thiếu gì) */
export function ImproveHint({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-card bg-page-surface p-4 text-sm leading-relaxed text-page-fg">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

/** Hàng tag (môi trường làm việc, kỹ năng) */
export function TagList({ tags }: { tags: string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t} className="rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
          {t}
        </li>
      ))}
    </ul>
  )
}
