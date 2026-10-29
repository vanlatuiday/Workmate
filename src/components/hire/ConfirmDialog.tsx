import { useState } from 'react'
import DialogShell from '@components/interview/DialogShell'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

type Props = {
  titleId: string
  title: string
  subtitle?: string
  description: string
  /** Có ô lý do (không bắt buộc) hay chỉ xác nhận */
  askReason?: boolean
  confirmLabel: string
  cancelLabel: string
  onConfirm: (reason?: string) => void
  onClose: () => void
}

/** Hộp thoại xác nhận nhỏ cho Không nhận / Từ chối / Rút lời mời; có thể kèm lý do tùy chọn. */
export default function ConfirmDialog({ titleId, title, subtitle, description, askReason, confirmLabel, cancelLabel, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('')
  return (
    <DialogShell titleId={titleId} title={title} subtitle={subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onConfirm(reason.trim() || undefined)
          onClose()
        }}
        className="space-y-5"
      >
        <p className="text-sm leading-relaxed text-page-muted">{description}</p>
        {askReason && (
          <label className="block">
            <span className="text-sm font-medium text-page-fg">Lý do <span className="font-normal text-page-muted">(không bắt buộc)</span></span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={cn('mt-2 block w-full resize-none rounded-control border border-page-edge bg-page-bg px-3 py-2 text-sm text-page-fg', FOCUS)}
            />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn('min-h-10 rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg', FOCUS)}>
            {cancelLabel}
          </button>
          <button type="submit" className={cn('min-h-10 rounded-full border border-page-fg bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg', FOCUS)}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
