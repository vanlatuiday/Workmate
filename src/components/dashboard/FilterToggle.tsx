import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@utils/cn'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'

type Props = {
  open: boolean
  onToggle: () => void
  /** Số bộ lọc đang bật (hiện thành huy hiệu) */
  count: number
  /** id của (các) khối lọc được nút này đóng/mở, cách nhau bằng dấu cách */
  controls: string
  className?: string
}

/** Nút "Bộ lọc" chỉ hiện ở màn hẹp (dưới md); từ md trở lên khối lọc luôn hiện nên không cần nút. */
export default function FilterToggle({ open, onToggle, count, controls, className }: Props) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={cn(BTN_SECONDARY, BTN_SM, 'md:hidden', className)}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      Bộ lọc
      {count > 0 && (
        <span className="tnum rounded-full border border-page-line px-2 text-xs" aria-label={`${count} bộ lọc đang bật`}>
          {count}
        </span>
      )}
    </button>
  )
}
