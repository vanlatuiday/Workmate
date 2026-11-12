import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'

/**
 * /tin-nhan — giữ nguyên URL (chia sẻ được `?c=<jobId>|<seekerId>`).
 *   chưa đăng nhập → /dang-nhap; admin → /admin;
 *   còn lại: Messenger (App.tsx) tự mở khung theo URL, trang này chỉ là nền ngà trống phía sau khung.
 */
export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role)
  const { search } = useLocation()

  if (!role) return <Navigate to="/dang-nhap" state={{ from: `/tin-nhan${search}` }} />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <div className="theme-ivory min-h-[70vh]" aria-hidden="true" />
}
