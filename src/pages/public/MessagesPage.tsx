import { useEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { useMessengerStore } from '@context/messengerStore'

/**
 * /tin-nhan — đường dẫn cũ của trang nhắn tin, nay chỉ còn là cửa chuyển hướng:
 *   chưa đăng nhập → /dang-nhap; admin → /admin; còn lại → mở khung tin nhắn nổi
 *   (đúng hội thoại nếu có `?c=<jobId>|<seekerId>`) rồi thay URL bằng "/".
 */
export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role)
  const [params] = useSearchParams()
  const openMessenger = useMessengerStore((s) => s.openMessenger)
  const canChat = role === 'jobseeker' || role === 'recruiter'
  const c = params.get('c')

  // Chỉ mở một lần: lúc <Navigate> chạy, URL mất `c` → không được mở lại với null
  const done = useRef(false)
  useEffect(() => {
    if (!canChat || done.current) return
    done.current = true
    openMessenger(c)
  }, [canChat, c, openMessenger])

  if (!role) return <Navigate to="/dang-nhap" state={{ from: '/tin-nhan' }} />
  if (role === 'admin') return <Navigate to="/admin" replace />
  // keepMessenger: báo cho Messenger đừng đóng khung khi đổi trang lần này
  return <Navigate to="/" replace state={{ keepMessenger: true }} />
}
