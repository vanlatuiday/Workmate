import type { ReactNode } from 'react'
import { cn } from '@utils/cn'

type Props = {
  title?: string
  /** Vd. link "Xem tất cả" ở góc phải tiêu đề */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** Thẻ nội dung chuẩn của dashboard (danh sách, biểu mẫu, khối thông tin). */
export default function Panel({ title, action, className, children }: Props) {
  return (
    <section className={cn('rounded-card border border-page-line bg-page-surface p-5 md:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="font-display text-lg font-medium text-page-fg">{title}</h2>}
          {action && <div className="text-sm">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
