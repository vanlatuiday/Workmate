import { useMemo } from 'react'
import { useUnreadMessages, useInterviews, useMyPairs } from '@services/connectionService'
import type { BadgeKind, SidebarRole } from './config'

/**
 * Số liệu thật cho huy hiệu thanh bên (lấy từ kho kết nối, không số cứng):
 * - messages: tổng tin nhắn chưa đọc
 * - applications: số đơn mình đã gửi / đã được kết nối (không tính "doanh nghiệp quan tâm mình" chưa phản hồi)
 * - interviews: số buổi phỏng vấn chờ xử lý hoặc sắp diễn ra (chờ xác nhận, hoặc đã xác nhận và chưa qua giờ)
 * Admin không có các số này nên mọi giá trị = 0.
 */
export function useSidebarBadges(role: SidebarRole): Record<BadgeKind, number> {
  const messages = useUnreadMessages()
  const interviews = useInterviews()
  const pairs = useMyPairs(role === 'seeker' ? 'seeker' : 'recruiter')

  return useMemo(() => {
    if (role === 'admin') return { messages: 0, applications: 0, interviews: 0 }
    const now = Date.now()
    const pendingInterviews = interviews.filter(
      (iv) => iv.status === 'pending' || (iv.status === 'confirmed' && (!iv.chosen || new Date(iv.chosen).getTime() >= now)),
    ).length
    return {
      messages,
      applications: role === 'seeker' ? pairs.filter((p) => p.status !== 'received').length : 0,
      interviews: pendingInterviews,
    }
  }, [role, messages, interviews, pairs])
}
