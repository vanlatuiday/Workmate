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
  className?: string
}

/**
 * Vòng tròn tiến độ (SVG). Mobile: hàng ngang trong luồng thường, vòng 44px kèm chữ.
 * Từ lg: cột hẹp, vòng 60px dính khi cuộn (đặt trong cột riêng nên không đè nội dung).
 */
export default function CompletionRing({ value, max, label, center, caption, rowText, className = '' }: CompletionRingProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className={`flex items-center gap-3 lg:sticky lg:top-24 lg:flex-col lg:gap-1.5 lg:self-start ${className}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${label}: ${center}`}
        className="glass-liquid relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:h-[3.75rem] lg:w-[3.75rem]"
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
            className="stroke-page-fg transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span className="tnum relative text-[0.6875rem] font-medium leading-none text-page-fg lg:text-xs">{center}</span>
      </div>
      {rowText && <span className="tnum text-sm text-page-fg lg:hidden">{rowText}</span>}
      {caption && <span className="hidden text-center text-[0.6875rem] leading-tight text-page-muted lg:block">{caption}</span>}
    </div>
  )
}
