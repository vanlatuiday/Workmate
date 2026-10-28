import { useState } from 'react'
import toast from 'react-hot-toast'
import { describeConversation } from '@pages/public/messages/describe'
import { confirmInterview, declineInterview, type Interview } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import DialogShell from './DialogShell'
import { fmtSlot, MODE_LABEL } from './format'

type Props = { interview: Interview; onClose: () => void }

/** Hộp thoại người tìm việc xem lời mời: chọn một khung giờ để xác nhận, hoặc từ chối. */
export default function ChooseSlotDialog({ interview: iv, onClose }: Props) {
  const info = describeConversation('seeker', iv.jobId, iv.seekerId)
  const [slot, setSlot] = useState(iv.slots[0])

  const confirm = () => {
    confirmInterview(iv.id, slot)
    toast.success('Đã xác nhận lịch phỏng vấn')
    onClose()
  }
  const decline = () => {
    declineInterview(iv.id)
    toast('Đã từ chối lời mời phỏng vấn')
    onClose()
  }

  return (
    <DialogShell titleId="choose-title" title={`Lời mời phỏng vấn · ${info.name}`} subtitle={info.subtitle} onClose={onClose}>
      <div className="space-y-6">
        <fieldset>
          <legend className="text-sm font-medium text-page-fg">Chọn một khung giờ</legend>
          <div className="mt-3 space-y-2">
            {iv.slots.map((s) => (
              <label key={s} className="block cursor-pointer">
                <input type="radio" name="slot" value={s} checked={slot === s} onChange={() => setSlot(s)} className="peer sr-only" />
                <span className="block rounded-card border border-page-edge px-4 py-3 text-base font-medium capitalize text-page-fg transition-colors duration-300 peer-checked:border-page-fg peer-checked:bg-page-surface peer-focus-visible:ring-2 peer-focus-visible:ring-page-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page-bg">
                  {fmtSlot(s)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <dl className="space-y-1 text-sm">
          <div className="flex gap-2"><dt className="w-24 shrink-0 text-page-muted">Hình thức</dt><dd className="text-page-fg">{MODE_LABEL[iv.mode]}</dd></div>
          <div className="flex gap-2"><dt className="w-24 shrink-0 text-page-muted">Địa điểm</dt><dd className="text-page-fg">{iv.place}</dd></div>
          {iv.note && <div className="flex gap-2"><dt className="w-24 shrink-0 text-page-muted">Ghi chú</dt><dd className="text-page-fg">{iv.note}</dd></div>}
        </dl>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={decline} className={cn('rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg', FOCUS)}>
            Từ chối
          </button>
          <button type="button" onClick={confirm} className={cn('rounded-full border border-page-fg bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg', FOCUS)}>
            Xác nhận giờ này
          </button>
        </div>
      </div>
    </DialogShell>
  )
}
