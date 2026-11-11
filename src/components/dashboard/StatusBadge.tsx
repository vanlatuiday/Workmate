import type { ReactNode } from 'react'
import { cn } from '@utils/cn'

type Props = {
  children: ReactNode
  /** strong = nền đặc, default = viền đậm, muted/neutral = viền mờ (xám).
   *  Trạng thái có màu: soft = quan tâm/đang cân nhắc, accent = đã kết nối/đang mở, warning = tạm dừng, danger = từ chối/lỗi */
  tone?: 'strong' | 'default' | 'muted' | 'neutral' | 'soft' | 'accent' | 'warning' | 'danger'
  /** Ghi đè thêm, vd. 'whitespace-normal' cho nhãn dài có thể xuống dòng */
  className?: string
}

const TONES = {
  strong: 'bg-page-fg text-page-bg border border-page-fg',
  default: 'border border-page-fg text-page-fg',
  muted: 'border border-page-line text-page-muted',
  neutral: 'border border-page-line text-page-muted',
  soft: 'border border-transparent bg-accent-soft text-accent-ink',
  accent: 'border border-accent bg-accent text-accent-fg',
  warning: 'border border-transparent bg-warning-soft text-warning-ink',
  danger: 'border border-transparent bg-danger-soft text-danger',
}

/** Nhãn trạng thái dạng pill. Màu chỉ hỗ trợ, không là kênh duy nhất — luôn kèm chữ. */
export default function StatusBadge({ children, tone = 'default', className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {children}
    </span>
  )
}
