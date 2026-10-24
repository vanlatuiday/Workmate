// Một ô bento tầng 2: tóm tắt + nút bút chì (chủ sở hữu). Cả ô là một nút mở chi tiết.
// Nút mở nằm dưới nội dung (absolute inset-0); nội dung để pointer-events-none,
// riêng các điều khiển bên trong (bút chì, công tắc, nút) bật lại pointer-events-auto.
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@utils/cn'
import { EditButton, FOCUS } from './ui'

export default function Tile({
  id,
  label,
  className,
  owner,
  index,
  reduced,
  onOpen,
  onEdit,
  children,
}: {
  id: string
  label: string
  className?: string
  owner: boolean
  /** Thứ tự xuất hiện lần lượt */
  index: number
  reduced: boolean
  onOpen: () => void
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    // Lớp ngoài chạy hiệu ứng vào; lớp trong lo hover (tránh hai bên tranh transform)
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduced ? 0 : index * 0.035, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          'group relative h-full rounded-card border border-page-line bg-page-surface p-5 transition-[transform,box-shadow] duration-300',
          'hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_color-mix(in_srgb,var(--page-fg)_35%,transparent)]',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        )}
      >
        <button
          type="button"
          data-cell-open={id}
          aria-haspopup="dialog"
          aria-label={`Xem chi tiết ${label}`}
          onClick={onOpen}
          className={cn('absolute inset-0 rounded-card', FOCUS)}
        />
        <div className="pointer-events-none relative flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-page-fg">{label}</h3>
            {owner && <EditButton label={label} onClick={onEdit} />}
          </div>
          <div className="flex-1 space-y-3">{children}</div>
          <p className="inline-flex items-center gap-1 text-xs text-page-muted" aria-hidden>
            Xem chi tiết
            <ArrowUpRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </motion.div>
  )
}
