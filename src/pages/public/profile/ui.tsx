import type { ReactNode } from 'react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

// Ô nhập kính: giống trang đăng tin — nền ngà trong suốt + nhòe phía sau, viền page-edge giữ đủ tương phản
export const INPUT = `w-full rounded-control border border-page-edge bg-[color-mix(in_srgb,var(--wm-ivory)_55%,transparent)] backdrop-blur-md px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Chip bật/tắt (loại việc, kỹ năng) */
export const chip = (on: boolean) =>
  cn(
    'rounded-full border px-4 py-2 text-sm transition-[color,background-color,border-color,transform] duration-200 active:scale-95 motion-reduce:transition-none',
    on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
    FOCUS,
  )

/** Nhóm trường dạng thẻ kính, số thứ tự mờ ở góc phải (chỉ trang trí); legend thả nổi để nằm trong thẻ. */
export function Group({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    <fieldset data-group className="glass-liquid rounded-card p-5 [--glass-alpha:40%]">
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
        className={`relative h-6 w-11 shrink-0 rounded-full border border-page-edge transition-colors duration-200 motion-reduce:transition-none ${FOCUS} ${checked ? 'bg-page-fg' : 'bg-page-surface'}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform duration-200 motion-reduce:transition-none ${checked ? 'translate-x-5 bg-page-bg' : 'bg-page-fg'}`} />
      </button>
      <span id={id} className="text-sm text-page-fg">{label}</span>
    </div>
  )
}
