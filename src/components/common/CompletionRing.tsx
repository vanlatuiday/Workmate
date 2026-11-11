import { FOCUS } from '@utils/focus'

/** Một gợi ý còn thiếu để đạt 100%; bấm để nhảy/focus tới phần tương ứng */
export interface RingSuggestion {
  key: string
  label: string
  onSelect: () => void
}

interface CompletionRingProps {
  value: number
  max: number
  /** Nhãn cho trình đọc màn hình */
  label: string
  /** Chữ ở giữa vòng, vd. "65%" hoặc "2/4" */
  center: string
  /** Dòng chữ nhỏ dưới vòng (chỉ hiện từ lg) */
  caption?: string
  /** Dòng chữ cạnh vòng ở mobile/tablet (ẩn từ lg) */
  rowText?: string
  /** Có truyền (kể cả rỗng) → hiện dạng thẻ kèm danh sách gợi ý thay vì cột hẹp */
  suggestions?: RingSuggestion[]
  className?: string
}

type BodyProps = { ratio: number; value: number; max: number; label: string; center: string; card?: boolean }

/** Vòng tròn + số ở giữa (dùng chung cho dạng cột và dạng thẻ) */
function RingBody({ ratio, value, max, label, center, card }: BodyProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${label}: ${center}`}
      className={`relative flex shrink-0 items-center justify-center rounded-full ${card ? 'h-14 w-14 bg-page-bg' : 'glass-liquid h-11 w-11 lg:h-[3.75rem] lg:w-[3.75rem]'}`}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r="26" fill="none" strokeWidth="4" className="stroke-page-line" />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ratio}
          className="stroke-page-fg transition-[stroke-dashoffset] duration-slow ease-editorial motion-reduce:transition-none"
        />
      </svg>
      <span className="tnum relative text-[0.6875rem] font-medium leading-none text-page-fg lg:text-xs">{center}</span>
    </div>
  )
}

/**
 * Vòng tròn tiến độ (SVG). Mobile: hàng ngang trong luồng thường, vòng 44px kèm chữ.
 * Từ lg: cột hẹp, vòng 60px dính khi cuộn (đặt trong cột riêng nên không đè nội dung).
 */
export default function CompletionRing({ value, max, label, center, caption, rowText, suggestions, className = '' }: CompletionRingProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const ring = (
    <div className={`flex items-center gap-3 lg:sticky lg:top-24 lg:flex-col lg:gap-1.5 lg:self-start ${className}`}>
      <RingBody ratio={ratio} value={value} max={max} label={label} center={center} />
      {rowText && <span className="tnum text-sm text-page-fg lg:hidden">{rowText}</span>}
      {caption && <span className="hidden text-center text-[0.6875rem] leading-tight text-page-muted lg:block">{caption}</span>}
    </div>
  )
  if (!suggestions) return ring
  return (
    <div className="rounded-card border border-page-line bg-page-surface p-4">
      {/* Trong thẻ: bỏ chế độ dính/cột dọc, vòng nằm ngang cạnh chữ ở mọi cỡ màn */}
      <div className="flex items-center gap-4">
        <RingBody card ratio={ratio} value={value} max={max} label={label} center={center} />
        <p className="tnum text-base font-medium text-page-fg">{rowText}</p>
      </div>
      {suggestions.length > 0 ? (
        <div className="mt-3 border-t border-page-line pt-3">
          <p className="text-sm text-page-muted">Để đạt 100%, bạn còn:</p>
          <ul className="mt-1.5 grid gap-x-4 sm:grid-cols-2">
            {suggestions.map((sg) => (
              <li key={sg.key}>
                <button
                  type="button"
                  onClick={sg.onSelect}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-control px-2 text-left text-sm text-page-fg transition-colors hover:bg-page-line motion-reduce:transition-none ${FOCUS}`}
                >
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-page-fg" />
                  {sg.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 border-t border-page-line pt-3 text-sm text-page-muted">Hồ sơ đã đầy đủ.</p>
      )}
    </div>
  )
}
