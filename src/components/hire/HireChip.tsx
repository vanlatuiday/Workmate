import type { ReactNode } from 'react'
import type { HireStatus } from '@services/connectionService'
import { cn } from '@utils/cn'

/** Chip trạng thái nhận việc: nền nhạt, viền mảnh, không hover — khác hẳn nút (nền đặc, có hover). */
const TONE: Record<HireStatus, string> = {
  offered: 'border-page-line bg-page-surface text-page-fg',
  accepted: 'border-accent bg-accent-soft text-page-fg',
  declined: 'border-danger/30 bg-danger-soft text-page-fg',
  rejected: 'border-danger/30 bg-danger-soft text-page-fg',
  withdrawn: 'border-page-line bg-page-surface text-page-muted',
}

export default function HireChip({ status, children, className }: { status: HireStatus; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex cursor-default select-none items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium', TONE[status], className)}>
      {status === 'accepted' && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {children}
    </span>
  )
}
