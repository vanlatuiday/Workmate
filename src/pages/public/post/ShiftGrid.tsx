import { useRef } from 'react'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

/**
 * Lưới ca làm 7 ngày × 3 buổi. Bấm để bật/tắt; nhấn giữ rồi kéo (chuột hoặc ngón tay)
 * để tô nhiều ô cùng lúc — ô đầu tiên quyết định kéo là bật hay tắt.
 * Khóa ca: `${ngày}-${buổi}` (khớp score.ts).
 */
export default function ShiftGrid({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  // Chế độ kéo: true = đang bật ô, false = đang tắt ô, null = không kéo
  const mode = useRef<boolean | null>(null)
  const current = useRef(value)
  current.current = value

  const apply = (key: string) => {
    if (mode.current === null) return
    const has = current.current.includes(key)
    if (mode.current && !has) onChange([...current.current, key])
    if (!mode.current && has) onChange(current.current.filter((k) => k !== key))
  }

  const keyAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-slot]')?.dataset.slot

  return (
    <div
      className="touch-none select-none overflow-x-auto"
      onPointerMove={(e) => {
        if (mode.current === null) return
        const k = keyAt(e.clientX, e.clientY)
        if (k) apply(k)
      }}
      onPointerUp={() => (mode.current = null)}
      onPointerCancel={() => (mode.current = null)}
      onPointerLeave={() => (mode.current = null)}
    >
      <div className="grid min-w-[20rem] grid-cols-[auto_repeat(3,1fr)] gap-1.5" role="group" aria-label="Ca làm trong tuần">
        <span />
        {SESSIONS.map((s) => (
          <span key={s} className="pb-1 text-center text-xs text-page-muted">{s}</span>
        ))}
        {DAY_SHORT.map((d, di) => (
          <div key={d} className="contents">
            <span className="flex items-center pr-2 text-xs text-page-muted">{d}</span>
            {SESSIONS.map((s, si) => {
              const key = `${di}-${si}`
              const on = value.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  data-slot={key}
                  aria-pressed={on}
                  aria-label={`${s} thứ ${di + 2 <= 7 ? di + 2 : 'CN'}`.replace('thứ CN', 'Chủ nhật')}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return
                    mode.current = !on
                    apply(key)
                  }}
                  // Chuột đã xử lý ở pointerdown; click do bàn phím (detail = 0) mới cần bật/tắt ở đây
                  onClick={(e) => {
                    if (e.detail !== 0) return
                    onChange(on ? value.filter((k) => k !== key) : [...value, key])
                  }}
                  className={cn(
                    'h-9 rounded-control border transition-colors duration-200',
                    on ? 'border-page-fg bg-page-fg' : 'border-page-line bg-page-bg hover:border-page-fg',
                    FOCUS,
                  )}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
