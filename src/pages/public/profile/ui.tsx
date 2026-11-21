import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'

// Ô nhập: nền bề mặt phẳng, viền page-edge giữ đủ tương phản
export const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Chip bật/tắt (loại việc, kỹ năng) */
export const chip = (on: boolean) => cn(CHIP, on ? CHIP_ON : CHIP_OFF)

/** Nhóm trường dạng thẻ; `id` là #neo cho mục lục và liên kết ngoài (scroll-mt chừa chỗ cho header cố định). */
export function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <fieldset id={id} data-group className="day-card relative scroll-mt-28 rounded-card border border-page-line bg-page-surface p-5">
      <legend className="float-left mb-4 w-full text-sm font-medium text-page-fg">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  )
}

/** Công tắc bật/tắt có nhãn bên cạnh */
export function Switch({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-fast motion-reduce:transition-none ${FOCUS} ${checked ? 'border-accent bg-accent' : 'border-page-edge bg-page-surface'}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform duration-fast motion-reduce:transition-none ${checked ? 'translate-x-5 bg-accent-fg' : 'bg-page-fg'}`} />
      </button>
      <span id={id} className="text-sm text-page-fg">{label}</span>
    </div>
  )
}

/** Chọn mức 1–5 (radiogroup: mũi tên đổi mức, Tab vào một lần). Bấm lại mức đang chọn = bỏ mức. */
export function LevelPicker({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const move = (e: ReactKeyboardEvent, n: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = Math.min(5, Math.max(1, n + d))
    onChange(next)
    ;(e.currentTarget.parentElement?.children[next - 1] as HTMLElement | undefined)?.focus()
  }
  return (
    <span className="flex items-center gap-1.5 pr-1">
      <span className="text-xs text-page-muted" aria-hidden>Mức</span>
      <span role="radiogroup" aria-label={`Mức ${label}`} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} trên 5`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => move(e, n)}
            className={`group flex h-6 w-5 items-center justify-center rounded-full ${FOCUS}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full border border-page-fg ${n <= value ? 'bg-page-fg' : 'bg-transparent'}`} />
          </button>
        ))}
      </span>
    </span>
  )
}
