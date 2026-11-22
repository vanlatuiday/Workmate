import { useState } from 'react'
import { unconnect, useCanUnconnect, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import UnconnectDialog from './UnconnectDialog'

/**
 * Nút nhỏ "Bỏ quan tâm" cho cặp đã kết nối (chữa bấm nhầm): hỏi xác nhận rồi báo toast có "Hoàn tác".
 * Ẩn khi hai bên đã nhận việc (máy chủ không cho bỏ).
 */
export default function UnconnectButton({ viewer, jobId, seekerId, name, className }: {
  viewer: Side; jobId: string; seekerId: string; name: string; className?: string
}) {
  const [open, setOpen] = useState(false)
  const allowed = useCanUnconnect(jobId, seekerId)
  if (!allowed) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('inline-flex min-h-9 items-center rounded-control px-2 text-xs text-page-muted underline underline-offset-4 transition-colors duration-fast hover:text-page-fg', FOCUS, className)}
      >
        Bỏ quan tâm<span className="sr-only"> {name}</span>
      </button>
      {open && (
        <UnconnectDialog
          viewer={viewer}
          name={name}
          onClose={() => setOpen(false)}
          onConfirm={() => { setOpen(false); unconnect(viewer, jobId, seekerId, name) }}
        />
      )}
    </>
  )
}
