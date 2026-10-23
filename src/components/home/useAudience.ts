import { useAuthStore } from '@context/authStore'
import { homeCopy, type Audience } from './content'

/** Người đang xem trang chủ (khách nếu chưa đăng nhập) và nội dung tương ứng. */
export function useHomeCopy() {
  const audience: Audience = useAuthStore((s) => s.user?.role) ?? 'guest'
  return homeCopy[audience]
}
