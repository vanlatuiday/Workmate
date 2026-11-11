import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Props = { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }

/** Trạng thái trống của danh sách/trang chưa có dữ liệu; action thường là nút pill dẫn đi tiếp. */
export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-page-line px-6 py-12 text-center">
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-page-line text-page-muted">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <p className="font-display text-lg font-medium text-page-fg">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-page-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
