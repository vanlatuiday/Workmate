import { useId, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import { StatusBadge } from '@components/dashboard'
import { setModeration, type AdminJobRow, type ModerationStatus } from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'

// Phần dùng chung của các trang quản trị: kiểu ô nhập, nhãn trạng thái, danh sách cờ,
// hộp xác nhận / nhập lý do và cụm nút kiểm duyệt một tin.

export const FIELD = `rounded-card border border-page-edge bg-page-surface px-4 py-2.5 text-sm text-page-fg ${FOCUS}`

/** Bỏ dấu + chữ thường để tìm "pha che" khớp "Pha chế" */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim()

export const STATUS_LABEL: Record<ModerationStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đang hiện',
  rejected: 'Bị từ chối',
  hidden: 'Bị ẩn',
}
export const STATUS_TONE: Record<ModerationStatus, 'neutral' | 'accent' | 'danger'> = {
  // Quy ước admin: chờ = xám, đã duyệt/đang mở = accent, từ chối/ẩn/khóa = danger
  pending: 'neutral',
  approved: 'accent',
  rejected: 'danger',
  hidden: 'danger',
}

/** Nhãn trạng thái kiểm duyệt của một tin (kèm "Công ty bị khóa" nếu có) */
export function JobStatusBadges({ row }: { row: AdminJobRow }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {/* Đã duyệt nhưng NTD tạm dừng/đóng thì không còn "Đang hiện" — tránh mâu thuẫn với huy hiệu NTD */}
      <StatusBadge tone={STATUS_TONE[row.status]}>
        {row.status === 'approved' && row.jobStatus !== 'open' ? 'Đã duyệt' : STATUS_LABEL[row.status]}
      </StatusBadge>
      {row.companyLocked && <StatusBadge tone="danger">Công ty bị khóa</StatusBadge>}
      {row.jobStatus !== 'open' && <StatusBadge tone="muted">{row.jobStatus === 'paused' ? 'NTD tạm dừng' : 'NTD đã đóng'}</StatusBadge>}
    </span>
  )
}

/** Danh sách lý do hệ thống tự gắn cờ */
export function FlagList({ flags }: { flags: string[] }) {
  if (!flags.length) return null
  return (
    <ul className="space-y-1.5" aria-label="Cờ cảnh báo">
      {flags.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-page-fg">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {f}
        </li>
      ))}
    </ul>
  )
}

/** Hộp xác nhận một hành động có ảnh hưởng lớn */
export function ConfirmDialog({
  title, message, confirmLabel, onConfirm, onCancel,
}: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const id = useId()
  return (
    <DialogShell titleId={id} title={title} onClose={onCancel}>
      <p className="text-sm leading-relaxed text-page-fg">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={cn(BTN_GHOST, BTN_SM)}>Hủy</button>
        <button type="button" onClick={onConfirm} className={cn(BTN_PRIMARY, BTN_SM)}>{confirmLabel}</button>
      </div>
    </DialogShell>
  )
}

const REASON_PRESETS = ['Thông tin sai', 'Nghi lừa đảo', 'Lương bất thường', 'Thiếu thông tin']

/** Hộp nhập lý do bắt buộc (từ chối / ẩn tin), có chip lý do gợi ý */
export function ReasonDialog({
  title, subtitle, confirmLabel, onConfirm, onCancel,
}: { title: string; subtitle?: string; confirmLabel: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const id = useId()
  const fieldId = useId()
  const [reason, setReason] = useState('')
  const ok = reason.trim().length > 0
  return (
    <DialogShell titleId={id} title={title} subtitle={subtitle} onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) onConfirm(reason.trim()) }}>
        <p className="text-sm text-page-muted">Chọn nhanh một lý do hoặc tự nhập:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {REASON_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={reason === p}
              onClick={() => setReason(p)}
              className={cn(CHIP, reason === p ? CHIP_ON : CHIP_OFF)}
            >
              {p}
            </button>
          ))}
        </div>
        <label htmlFor={fieldId} className="mt-4 block text-sm text-page-muted">Lý do (bắt buộc)</label>
        <textarea id={fieldId} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={`mt-1 w-full ${FIELD}`} />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={cn(BTN_GHOST, BTN_SM)}>Hủy</button>
          <button type="submit" disabled={!ok} className={cn(BTN_PRIMARY, BTN_SM)}>{confirmLabel}</button>
        </div>
      </form>
    </DialogShell>
  )
}

/**
 * Cụm nút kiểm duyệt một tin theo trạng thái hiện tại:
 * chờ duyệt → Duyệt / Từ chối · đang hiện → Ẩn tin · bị từ chối / ẩn → Khôi phục.
 * Từ chối và Ẩn tin mở hộp nhập lý do. `onDone` để trang đóng khung chi tiết (nếu cần).
 */
export function JobActions({ row, onDone }: { row: AdminJobRow; onDone?: () => void }) {
  const [dialog, setDialog] = useState<'reject' | 'hide' | null>(null)
  const { job, status } = row

  const apply = (next: ModerationStatus, message: string, reason?: string) => {
    setModeration(job.id, next, reason)
    setDialog(null)
    toast.success(message)
    onDone?.()
  }

  return (
    <>
      {status === 'pending' && (
        <>
          <button type="button" onClick={() => apply('approved', `Đã duyệt tin "${job.title}"`)} className={cn(BTN_PRIMARY, BTN_SM)}>
            Duyệt<span className="sr-only"> {job.title}</span>
          </button>
          <button type="button" onClick={() => setDialog('reject')} className={cn(BTN_DANGER, BTN_SM)}>
            Từ chối<span className="sr-only"> {job.title}</span>
          </button>
        </>
      )}
      {status === 'approved' && (
        <button type="button" onClick={() => setDialog('hide')} className={cn(BTN_DANGER, BTN_SM)}>
          Ẩn tin<span className="sr-only"> {job.title}</span>
        </button>
      )}
      {(status === 'rejected' || status === 'hidden') && (
        <button type="button" onClick={() => apply('approved', `Đã khôi phục tin "${job.title}"`)} className={cn(BTN_SECONDARY, BTN_SM)}>
          Khôi phục<span className="sr-only"> {job.title}</span>
        </button>
      )}
      {dialog === 'reject' && (
        <ReasonDialog
          title="Từ chối tin"
          subtitle={job.title}
          confirmLabel="Từ chối tin"
          onCancel={() => setDialog(null)}
          onConfirm={(r) => apply('rejected', `Đã từ chối tin "${job.title}"`, r)}
        />
      )}
      {dialog === 'hide' && (
        <ReasonDialog
          title="Ẩn tin"
          subtitle={job.title}
          confirmLabel="Ẩn tin"
          onCancel={() => setDialog(null)}
          onConfirm={(r) => apply('hidden', `Đã ẩn tin "${job.title}"`, r)}
        />
      )}
    </>
  )
}
