import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'

/**
 * /tin-nhan — đường dẫn cũ của trang nhắn tin, nay chỉ còn là cửa chuyển hướng:
 *   chưa đăng nhập → /dang-nhap; admin → /admin; còn lại → mở khung tin nhắn nổi
 *   (đúng hội thoại nếu có `?c=<jobId>|<seekerId>`) rồi thay URL bằng "/".
 */
export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role)
  const [params] = useSearchParams()
  const c = params.get('c')

  if (!role) return <Navigate to="/dang-nhap" state={{ from: '/tin-nhan' }} />
  if (role === 'admin') return <Navigate to="/admin" replace />
  // keepMessenger: Messenger đừng đóng khung khi đổi trang lần này; openChat: Messenger tự mở (xem Messenger.tsx)
  return <Navigate to="/" replace state={{ keepMessenger: true, openChat: c }} />
}
