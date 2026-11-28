import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Side } from '@context/connectionStore'
import { useAuthStore } from '@context/authStore'
import { apiErrorMessage, authService } from '@services/authService'
import { cn } from '@utils/cn'
import { notifySuccess } from '@utils/feedback'
import { FOCUS } from '@utils/focus'
import { BTN_DANGER, BTN_GHOST, BTN_SM } from '@utils/ui'
import PasswordField from './PasswordField'

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

export default function AccountDeletion({ side }: { side: Side }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const userId = useAuthStore((s) => s.user?.id)
  const confirmationId = useId()
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  const deleteAccount = async () => {
    setDeleteError('')
    setDeleteBusy(true)
    try {
      await authService.deleteAccount(deletePassword)
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Chưa xóa được tài khoản, vui lòng thử lại.'))
      setDeleteBusy(false)
      return
    }
    if (useAuthStore.getState().user?.id !== userId) return
    logout()
    navigate('/', { replace: true })
    notifySuccess('Đã xóa tài khoản và dữ liệu của bạn')
  }

  return (
    <>
      <p className="mb-4 text-sm text-page-muted">
        {side === 'seeker'
          ? 'Xóa vĩnh viễn hồ sơ, CV, ảnh đại diện, đơn ứng tuyển, kết nối, tin nhắn, lịch phỏng vấn và đánh giá của bạn. Không thể khôi phục.'
          : 'Xóa vĩnh viễn tài khoản của bạn. Nếu bạn là người quản lý duy nhất, công ty cùng mọi tin tuyển dụng, kết nối và tin nhắn với ứng viên cũng bị xóa. Không thể khôi phục.'}
      </p>
      {!deleting ? (
        <button type="button" className={cn(BTN_DANGER, BTN_SM)} onClick={() => setDeleting(true)}>Xóa tài khoản</button>
      ) : (
        <form
          aria-label="Xác nhận xóa tài khoản"
          className="flex flex-col gap-4 rounded-card border border-page-fg p-4"
          onSubmit={(e) => { e.preventDefault(); if (confirmText.trim() === 'XÓA' && deletePassword && !deleteBusy) void deleteAccount() }}
        >
          <PasswordField label="Mật khẩu của bạn" value={deletePassword} onChange={setDeletePassword} error={deleteError} autoComplete="current-password" />
          <div>
            <label htmlFor={confirmationId} className="text-sm text-page-fg">Gõ <strong>XÓA</strong> để xác nhận.</label>
            <input id={confirmationId} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className={`${FIELD} mt-2`} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={confirmText.trim() !== 'XÓA' || !deletePassword || deleteBusy} className={cn(BTN_DANGER, BTN_SM)}>
              {deleteBusy ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
            </button>
            <button type="button" disabled={deleteBusy} className={cn(BTN_GHOST, BTN_SM)} onClick={() => { setDeleting(false); setConfirmText(''); setDeletePassword(''); setDeleteError('') }}>Hủy</button>
          </div>
        </form>
      )}
    </>
  )
}
