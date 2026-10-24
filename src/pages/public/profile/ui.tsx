// Các mảnh giao diện nhỏ dùng chung trong trang cá nhân.
import { Lock, Pencil } from 'lucide-react'
import { cn } from '@utils/cn'
import { LEVEL_LABELS, type Level } from './model'

/** Vòng focus dùng chung cho nút/link */
export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'

/** Nút viên thuốc: primary (đặc) hoặc outline */
export function Btn({
  variant = 'outline',
  pressed,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline'; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      {...rest}
      className={cn(
        'pointer-events-auto relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
        variant === 'primary' || pressed
          ? 'bg-page-fg text-page-bg hover:opacity-90'
          : 'border border-page-fg text-page-fg hover:bg-page-surface',
        FOCUS,
        className,
      )}
    />
  )
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-page-edge px-3 py-1 text-xs font-medium text-page-fg', className)}>
      {children}
    </span>
  )
}

/** Nút bút chì ở góc ô (chỉ chủ sở hữu) */
export function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Sửa ${label}`}
      className={cn(
        'pointer-events-auto relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-page-line text-page-muted transition-colors hover:bg-page-bg hover:text-page-fg',
        FOCUS,
      )}
    >
      <Pencil className="h-4 w-4" aria-hidden />
    </button>
  )
}

/** Công tắc Hiện/Ẩn cho quyền riêng tư */
export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'đang hiện' : 'đang ẩn'} với người xem`}
      onClick={() => onChange(!checked)}
      className={cn('pointer-events-auto relative z-10 inline-flex items-center gap-2 rounded-full py-1 text-xs font-medium text-page-muted', FOCUS)}
    >
      <span className="w-7 text-right">{checked ? 'Hiện' : 'Ẩn'}</span>
      <span
        aria-hidden
        className={cn(
          'relative h-5 w-9 rounded-full border transition-colors',
          checked ? 'border-page-fg bg-page-fg' : 'border-page-edge bg-page-bg',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full transition-transform duration-200',
            checked ? 'translate-x-4 bg-page-bg' : 'bg-page-fg',
          )}
        />
      </span>
    </button>
  )
}

export function HiddenInfo() {
  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-page-muted">
      <Lock className="h-3.5 w-3.5" aria-hidden />
      Thông tin được ẩn
    </p>
  )
}

/** Thanh mức thành thạo 5 nấc + nhãn */
export function LevelBar({ level, showLabel = true }: { level: Level; showLabel?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span role="img" aria-label={`Mức ${level}/5 — ${LEVEL_LABELS[level]}`} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn('h-1.5 w-4 rounded-full', n <= level ? 'bg-page-fg' : 'bg-page-line')} />
        ))}
      </span>
      {showLabel && <span className="text-xs text-page-muted">{LEVEL_LABELS[level]}</span>}
    </span>
  )
}

/** Dòng thời gian dọc: mỗi mục có mốc, tiêu đề, mô tả */
export function Timeline({ items }: { items: { key: string; when: string; title: string; text?: string }[] }) {
  return (
    <ol className="space-y-4 border-l border-page-line pl-4">
      {items.map((it) => (
        <li key={it.key} className="relative">
          <span aria-hidden className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-page-fg" />
          <p className="text-xs text-page-muted">{it.when}</p>
          <p className="text-sm font-medium text-page-fg">{it.title}</p>
          {it.text && <p className="mt-0.5 text-sm text-page-muted">{it.text}</p>}
        </li>
      ))}
    </ol>
  )
}

export function Tags({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li key={t} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">
          {t}
        </li>
      ))}
    </ul>
  )
}

/** "và N mục khác" khi tóm tắt cắt bớt */
export function More({ count, unit }: { count: number; unit: string }) {
  return count > 0 ? <p className="text-sm text-page-muted">và {count} {unit} khác</p> : null
}

/** Cặp nhãn – giá trị */
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-page-muted">{label}</p>
      <div className="text-sm text-page-fg">{children}</div>
    </div>
  )
}
