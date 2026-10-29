import { useState } from 'react'
import toast from 'react-hot-toast'
import { describeConversation } from '@pages/public/messages/describe'
import { offerJob } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import DialogShell from '@components/interview/DialogShell'
import { todayStr } from './format'

type Props = { jobId: string; seekerId: string; onClose: () => void }

const FIELD = cn('block w-full rounded-control border border-page-edge bg-page-bg px-3 py-2 text-sm text-page-fg placeholder:text-page-muted', FOCUS)

/** Hộp thoại doanh nghiệp mời một ứng viên đã kết nối nhận việc: ngày bắt đầu + lời nhắn tùy chọn. */
export default function OfferDialog({ jobId, seekerId, onClose }: Props) {
  const info = describeConversation('recruiter', jobId, seekerId)
  const today = todayStr()
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!date) return setError('Hãy chọn ngày bắt đầu làm.')
    if (date < today) return setError('Ngày bắt đầu không được ở quá khứ.')
    offerJob({ jobId, seekerId, startDate: date, note: note.trim() || undefined })
    toast.success(`Đã gửi lời mời nhận việc tới ${info.name}`)
    onClose()
  }

  return (
    <DialogShell titleId="offer-title" title={`Nhận ${info.name} vào làm`} subtitle={info.subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-6"
      >
        <p className="text-sm leading-relaxed text-page-muted">
          Ứng viên sẽ nhận được lời mời và cần xác nhận đi làm. Chỉ khi họ xác nhận, lượt này mới được tính là "đã đi làm".
        </p>
        <label className="block">
          <span className="text-sm font-medium text-page-fg">Ngày bắt đầu</span>
          <input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setError('') }} className={cn(FIELD, 'mt-2')} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-page-fg">Lời nhắn <span className="font-normal text-page-muted">(không bắt buộc)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Vd. đến sớm 15 phút, mặc áo tối màu" className={cn(FIELD, 'mt-2 resize-none')} />
        </label>

        {error && <p role="alert" className="text-sm text-page-fg">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn('min-h-10 rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg', FOCUS)}>
            Để sau
          </button>
          <button type="submit" className={cn('min-h-10 rounded-full border border-page-fg bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg', FOCUS)}>
            Gửi lời mời
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
