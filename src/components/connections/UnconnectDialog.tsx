import DialogShell from '@components/interview/DialogShell'
import { cn } from '@utils/cn'
import { BTN_DANGER, BTN_SECONDARY } from '@utils/ui'
import type { Side } from '@services/connectionService'

/** Hộp xác nhận "Bỏ quan tâm" sau khi đã kết nối: nói rõ hệ quả trước khi làm (giúp chữa tay bấm nhầm) */
export default function UnconnectDialog({ viewer, name, onConfirm, onClose }: {
  /** Phía của người đang bấm — để gọi đúng "bên kia" */
  viewer: Side
  name: string
  onConfirm: () => void
  onClose: () => void
}) {
  const peer = viewer === 'seeker' ? 'Nhà tuyển dụng' : 'Ứng viên'
  const consequences = [
    'Tin nhắn cũ vẫn xem lại được nhưng không gửi tiếp',
    'Lịch phỏng vấn sắp tới và đề nghị nhận việc chưa trả lời sẽ bị hủy',
    `${peer} không nhận thông báo`,
    'Quan tâm lại thì kết nối lại nếu họ vẫn còn quan tâm',
  ]
  return (
    <DialogShell titleId="unconnect-title" title={`Bỏ quan tâm ${name}?`} onClose={onClose} className="md:max-w-md">
      <ul className="list-disc space-y-2 pl-5 text-sm text-page-fg marker:text-page-muted">
        {consequences.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className={cn(BTN_SECONDARY)}>Giữ kết nối</button>
        <button type="button" onClick={onConfirm} className={cn(BTN_DANGER)}>Bỏ quan tâm</button>
      </div>
    </DialogShell>
  )
}
