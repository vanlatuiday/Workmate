import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DialogShell from '@components/interview/DialogShell'
import { BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'
import { leaveTarget } from './leaveDashboard'

/**
 * Chặn click vào liên kết dẫn ra ngoài khu làm việc (nội dung + thanh bên) và hỏi lại trước khi rời.
 * Không chặn: phím bổ trợ/chuột giữa, target=_blank, download, liên kết ngoài, hash, cùng khu, data-no-leave-confirm.
 * Đặt một lần trong mỗi khung dashboard.
 */
export default function LeaveDashboardDialog() {
  const navigate = useNavigate()
  const [pending, setPending] = useState<{ to: string; name: string } | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a) return
      const hit = leaveTarget(a, window.location)
      if (!hit) return
      e.preventDefault()
      setPending(hit)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  if (!pending) return null
  const stay = () => setPending(null)
  return (
    <DialogShell titleId="leave-dashboard-title" title="Rời khu làm việc?" onClose={stay} className="md:max-w-md">
      <p className="text-sm text-page-fg">Bạn sẽ được chuyển đến trang {pending.name}.</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={stay} className={BTN_SECONDARY}>Ở lại</button>
        <button type="button" onClick={() => { const to = pending.to; setPending(null); navigate(to) }} className={BTN_PRIMARY}>Tiếp tục</button>
      </div>
    </DialogShell>
  )
}
