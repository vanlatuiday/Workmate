import { useState } from 'react'
import { Link } from 'react-router-dom'
import DialogShell from '@components/interview/DialogShell'
import { BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'

type MatchAction = {
  name: string
  score: number
  label: string
  run: () => void
}

export function useMatchConfirmation(profileIncomplete = false) {
  const [pending, setPending] = useState<MatchAction | null>(null)
  const close = () => setPending(null)

  const request = (action: MatchAction) => {
    if (action.score < 50) setPending(action)
    else action.run()
  }

  const dialog = pending && (
    <DialogShell
      titleId="match-confirmation-title"
      title={profileIncomplete ? 'Bạn muốn hoàn thành CV ngay không?' : 'Bạn có muốn tiếp tục?'}
      subtitle={`${pending.name} · Phù hợp ${pending.score}%`}
      onClose={close}
      className="md:max-w-md"
    >
      <p className="text-sm leading-relaxed text-page-muted">
        {profileIncomplete
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
