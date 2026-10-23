import type { ReactNode } from 'react'
import { cn } from '@utils/cn'

type Props = {
  children: ReactNode
  /** strong = nền đặc, default = viền đậm, muted = viền mờ */
  tone?: 'strong' | 'default' | 'muted'
}

const TONES = {
  strong: 'bg-page-fg text-page-bg border border-page-fg',
  default: 'border border-page-fg text-page-fg',
  muted: 'border border-page-line text-page-muted',
}

/** Nhãn trạng thái dạng pill. Mức độ thể hiện bằng độ đậm, không bằng màu — nên luôn kèm chữ. */
export default function StatusBadge({ children, tone = 'default' }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone])}>
      {children}
    </span>
  )
}
