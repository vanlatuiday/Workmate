import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import DialogShell from '@components/interview/DialogShell'
import { BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'

type MatchAction = {
  name: string
  score?: number
  working?: boolean
  label: string
  run: () => void
}

export function useMatchConfirmation(profileIncomplete = false) {
  const [pending, setPending] = useState<MatchAction | null>(null)
  const titleId = useId()
  const lowFit = (pending?.score ?? 50) < 50
  const close = () => setPending(null)

  const request = (action: MatchAction) => {
    if (action.working || (action.score ?? 50) < 50) setPending(action)
    else action.run()
  }

  const dialog = pending && (
    <DialogShell
      titleId={titleId}
      title={pending.working ? 'Ứng viên đã nhận việc khác' : profileIncomplete ? 'Bạn muốn hoàn thành CV ngay không?' : 'Bạn có muốn tiếp tục?'}
      subtitle={pending.score === undefined ? pending.name : `${pending.name} · Phù hợp ${pending.score}%`}
      onClose={close}
      className="md:max-w-md"
    >
      <p className="text-sm leading-relaxed text-page-muted">
        {pending.working
          ? `Ứng viên này đã nhận một công việc khác trên Workmate. ${lowFit ? 'Mức độ phù hợp với vị trí này dưới 50%. ' : ''}Bạn có muốn tiếp tục quan tâm không?`
          : profileIncomplete
          ? 'Hồ sơ của bạn còn thiếu thông tin. Hoàn thành CV để doanh nghiệp hiểu rõ hơn về bạn.'
          : 'Mức độ phù hợp dưới 50%. Bạn có chắc muốn tiếp tục với lựa chọn này không?'}
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {profileIncomplete ? (
          <Link to="/ho-so" onClick={close} className={BTN_SECONDARY}>Hoàn thành CV</Link>
        ) : (
          <button type="button" onClick={close} className={BTN_SECONDARY}>Quay lại</button>
        )}
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => {
            close()
            pending.run()
          }}
        >
          {profileIncomplete ? 'Tiếp tục' : pending.label}
        </button>
      </div>
    </DialogShell>
  )

  return { request, dialog }
}
