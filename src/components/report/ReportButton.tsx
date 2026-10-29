import { useId, useState } from 'react'
import toast from 'react-hot-toast'
import { Flag } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import { useAuthStore } from '@context/authStore'
import { fileReport, type ReportTarget } from '@services/adminService'
import { FOCUS } from '@utils/focus'

// Nút "Báo cáo" kín đáo ở cuối khung chi tiết: chọn lý do + ghi chú → vào hàng chờ của quản trị viên.

const REASONS: Record<ReportTarget, string[]> = {
  job: ['Lừa đảo', 'Sai thông tin', 'Nội dung không phù hợp', 'Khác'],
  seeker: ['Hồ sơ giả', 'Không đến phỏng vấn', 'Quấy rối', 'Khác'],
}

type Props = {
  target: ReportTarget
  /** Id tin (jobId) hoặc id người tìm việc */
  targetId: string
  /** Tên hiển thị trong hộp thoại */
  name: string
  className?: string
}

function ReportDialog({ target, targetId, name, onClose }: Omit<Props, 'className'> & { onClose: () => void }) {
  const titleId = useId()
  const noteId = useId()
  const role = useAuthStore((s) => s.user?.role)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return
    fileReport({ target, targetId, reason, note: note.trim() || undefined, by: role === 'jobseeker' ? 'seeker' : role === 'recruiter' ? 'recruiter' : 'guest' })
    toast.success('Đã gửi báo cáo, quản trị viên sẽ xem xét')
    onClose()
  }

  return (
    <DialogShell titleId={titleId} title="Báo cáo vi phạm" subtitle={name} onClose={onClose}>
      <form onSubmit={submit}>
        <fieldset>
          <legend className="text-sm text-page-muted">Lý do (bắt buộc)</legend>
          <div className="mt-2 space-y-2">
            {REASONS[target].map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3 rounded-card border border-page-line px-4 py-2.5 text-sm text-page-fg has-[:checked]:border-page-fg">
                <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className={`h-4 w-4 accent-wm-charcoal ${FOCUS}`} />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor={noteId} className="mt-4 block text-sm text-page-muted">Ghi chú (không bắt buộc)</label>
        <textarea
          id={noteId} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
          className={`mt-1 w-full rounded-card border border-page-edge bg-page-surface px-4 py-2.5 text-sm text-page-fg ${FOCUS}`}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={`rounded-full border border-page-line px-4 py-2 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`}>Hủy</button>
          <button type="submit" disabled={!reason} className={`rounded-full border border-page-fg bg-page-fg px-4 py-2 text-sm font-medium text-page-bg disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}>Gửi báo cáo</button>
        </div>
      </form>
    </DialogShell>
  )
}

/** Nút dạng link nhỏ, chữ muted; bấm mở hộp thoại báo cáo. */
export default function ReportButton({ target, targetId, name, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-control text-xs text-page-muted underline-offset-4 transition-colors duration-300 hover:text-page-fg hover:underline ${FOCUS} ${className}`}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        Báo cáo<span className="sr-only"> {target === 'job' ? 'tin' : 'ứng viên'} {name}</span>
      </button>
      {open && <ReportDialog target={target} targetId={targetId} name={name} onClose={() => setOpen(false)} />}
    </>
  )
}
