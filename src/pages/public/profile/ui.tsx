import type { ReactNode } from 'react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'

// Ô nhập: nền bề mặt phẳng, viền page-edge giữ đủ tương phản
export const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Chip bật/tắt (loại việc, kỹ năng) */
export const chip = (on: boolean) => cn(CHIP, on ? CHIP_ON : CHIP_OFF)

/** Nhóm trường dạng thẻ kính, số thứ tự mờ ở góc phải (chỉ trang trí); legend thả nổi để nằm trong thẻ. */
export function Group({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    <fieldset data-group className="relative rounded-card border border-page-line bg-page-surface p-5">
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-2 select-none font-display text-5xl font-semibold leading-none text-page-line">
        {String(index).padStart(2, '0')}
      </span>
      <legend className="float-left mb-4 w-full pr-16 text-sm font-medium text-page-fg">{title}</legend>
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
