// Thanh "Mức độ hoàn thiện hồ sơ" + gợi ý mục còn thiếu (chỉ chủ sở hữu).
import { useId } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@utils/cn'
import { completionPercent, type CompletionCheck } from './logic'
import { FOCUS } from './ui'

export default function CompletionBar({ checks, onPick }: { checks: CompletionCheck[]; onPick: (cell: string) => void }) {
  const labelId = useId()
  const percent = completionPercent(checks)
  const missing = checks.filter((c) => !c.done)
  return (
    <section aria-labelledby={labelId} className="rounded-card border border-page-line bg-page-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id={labelId} className="font-display text-lg font-semibold">
          Mức độ hoàn thiện hồ sơ
        </h2>
        <p className="font-display text-lg font-semibold">{percent}%</p>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-page-line"
      >
        <div className="h-full origin-left rounded-full bg-page-fg transition-transform duration-500" style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm text-page-muted">Bổ sung để hồ sơ nổi bật hơn:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => onPick(c.cell)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-page-edge px-3 py-1.5 text-sm text-page-fg transition-colors hover:bg-page-bg',
                    FOCUS,
                  )}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-page-muted">Hồ sơ đã đầy đủ các mục gợi ý.</p>
      )}
    </section>
  )
}
