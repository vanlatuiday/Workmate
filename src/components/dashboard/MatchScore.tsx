type Props = {
  /** 0–100 */
  score: number
  size?: 'sm' | 'md'
  /** Thanh dày/đậm lên khi hàng cha (class `group/row`) được hover/focus-within */
  reactive?: boolean
}

/** Mức phù hợp theo điểm (khớp MatchLevel trong @/types). */
function levelOf(score: number) {
  if (score >= 80) return 'Rất phù hợp'
  if (score >= 60) return 'Phù hợp'
  if (score >= 40) return 'Có thể phù hợp'
  return 'Ít phù hợp'
}

/** Điểm phù hợp việc làm–ứng viên: số %, thanh mảnh và nhãn mức. Dùng ở thẻ việc/ứng viên. */
export default function MatchScore({ score, size = 'md', reactive }: Props) {
  const value = Math.round(Math.min(100, Math.max(0, score)))
  const level = levelOf(value)
  return (
    <div role="img" aria-label={`Độ phù hợp ${value}%, ${level}`} className={`flex-shrink-0 ${size === 'sm' ? 'w-32' : 'w-40'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`tnum font-display font-medium text-page-fg ${size === 'sm' ? 'text-base' : 'text-2xl'}`}>
          {value}%
        </span>
        <span className="whitespace-nowrap text-xs text-page-muted">{level}</span>
      </div>
      <div
        className={`mt-1.5 h-1 overflow-hidden rounded-full bg-page-line ${reactive ? 'origin-center transition-transform duration-base ease-out group-focus-within/row:scale-y-[1.75] group-hover/row:scale-y-[1.75] motion-reduce:transition-none' : ''}`}
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full bg-accent ${reactive ? 'transition-[filter] duration-base ease-out group-focus-within/row:brightness-90 group-hover/row:brightness-90 motion-reduce:transition-none' : ''}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
