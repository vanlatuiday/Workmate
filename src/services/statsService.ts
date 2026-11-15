// Thống kê của người tìm việc (/api/seeker/stats). Trả về { data, error } — error là chuỗi tiếng Việt.
import api from './api'
import { apiErrorMessage } from './authService'

export type SeekerStats = {
  totals: {
    applied: number
    viewed: number
    considering: number
    invited: number
    connected: number
    interviews: number
    upcomingInterviews: number
    pendingInterviews: number
    hired: number
    offers: number
    saved: number
  }
  rates: {
    /** % đơn được doanh nghiệp mở xem; null khi chưa có đơn */
    viewed: number | null
    /** % đơn gửi + lời mời được nhận thành kết nối; null khi chưa có */
    connected: number | null
  }
  /** 8 tuần, cũ trước; weekStart là thứ Hai (YYYY-MM-DD, giờ VN) */
  weekly: { weekStart: string; applied: number; invited: number; connected: number }[]
  rating: { average: number; count: number } | null
}

export async function fetchSeekerStats(): Promise<{ data: SeekerStats | null; error: string | null }> {
  try {
    const res = await api.get<SeekerStats>('/seeker/stats')
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: apiErrorMessage(err, 'Không tải được thống kê.') }
  }
}
