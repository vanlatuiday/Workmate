// Thanh điều khiển demo: chọn "Tôi là ai" và "đang xem trang nào" (đọc/ghi từ query ở ProfilePage).
import { RotateCcw } from 'lucide-react'
import { cn } from '@utils/cn'
import type { DemoActor, DemoView } from './store'
import { FOCUS } from './ui'

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; text: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-page-edge p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            value === o.value ? 'bg-page-fg text-page-bg' : 'text-page-muted hover:text-page-fg',
            FOCUS,
          )}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}

export default function DemoBar({
  actor,
  view,
  onChange,
  onReset,
}: {
  actor: DemoActor
  view: DemoView
  onChange: (actor: DemoActor, view: DemoView) => void
  onReset: () => void
}) {
  return (
    <section aria-label="Điều khiển bản demo" className="border-b border-page-line pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Tôi là"
          value={actor}
          onChange={(a) => onChange(a, view)}
          options={[
            { value: 'seeker', text: 'Tôi là người tìm việc' },
            { value: 'company', text: 'Tôi là doanh nghiệp' },
          ]}
        />
        <Segmented
          label="Trang đang xem"
          value={view}
          onChange={(v) => onChange(actor, v)}
          options={[
            { value: 'own', text: 'Trang của tôi' },
            { value: 'other', text: 'Trang của đối phương' },
          ]}
        />
        <button
          type="button"
          onClick={onReset}
          className={cn('inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-page-muted hover:text-page-fg', FOCUS)}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Khôi phục dữ liệu mẫu
        </button>
      </div>
      <p className="mt-3 text-xs text-page-muted">Bản demo — dữ liệu mẫu, tải lại trang sẽ về mặc định.</p>
    </section>
  )
}
