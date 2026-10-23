import type { ReactNode } from 'react'

type Props = { title: string; description?: string; actions?: ReactNode }

/** Đầu mỗi trang dashboard: tiêu đề, mô tả ngắn và (tùy chọn) nút hành động bên phải. */
export default function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-3xl font-medium text-page-fg">{title}</h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm md:text-base leading-relaxed text-page-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
