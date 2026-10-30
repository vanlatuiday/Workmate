import type { HireStatus, Side } from '@services/connectionService'

/** "05/11/2026" từ chuỗi ngày YYYY-MM-DD */
export const fmtDay = (d: string) => new Date(`${d}T00:00`).toLocaleDateString('vi-VN')

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ máy (cho `min` của ô chọn ngày) */
export const todayStr = () => new Date().toLocaleDateString('sv-SE')

/** Nhãn trạng thái nhận việc theo người xem (lời lẽ nhẹ nhàng, tôn trọng) */
export const HIRE_LABEL: Record<Side, Record<HireStatus, string>> = {
  recruiter: {
    offered: 'Chờ xác nhận đi làm',
    accepted: 'Đã đi làm',
    declined: 'Ứng viên từ chối',
    withdrawn: 'Đã rút lời mời',
    rejected: 'Đã không nhận',
  },
  seeker: {
    offered: 'Có lời mời nhận việc',
    accepted: 'Đã đi làm',
    declined: 'Bạn đã từ chối',
    withdrawn: 'Lời mời đã được rút',
    rejected: 'Lần này chưa phù hợp',
  },
}

/** "dd/mm" từ chuỗi ngày YYYY-MM-DD */
const fmtDayShort = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

/**
 * Nhãn của một bản ghi nhận việc. Đã xác nhận nhưng chưa tới ngày bắt đầu → "sẽ đi làm từ…"
 * (số liệu thống kê vẫn tính là đã đi làm); từ ngày bắt đầu trở đi → "Đã đi làm · từ …".
 */
export function hireLabel(viewer: Side, hire: { status: HireStatus; startDate?: string }): string {
  if (hire.status !== 'accepted' || !hire.startDate) return HIRE_LABEL[viewer][hire.status]
  const day = fmtDayShort(hire.startDate)
  if (hire.startDate > todayStr()) return viewer === 'recruiter' ? `Nhận việc · bắt đầu ${day}` : `Sẽ đi làm từ ${day}`
  return `Đã đi làm · từ ${day}`
}

/** Thẻ nhanh khi đánh giá: người tìm việc → công ty, doanh nghiệp → người tìm việc */
export const REVIEW_TAGS: Record<Side, string[]> = {
  seeker: ['Trả lương đúng hẹn', 'Đúng mô tả công việc', 'Môi trường thân thiện', 'Quản lý hướng dẫn tận tình'],
  recruiter: ['Đúng giờ', 'Chăm chỉ', 'Học việc nhanh', 'Thái độ tốt'],
}

/** Rút gọn tên người: "Nguyễn Văn An" → "Nguyễn V. A." (tên đã viết tắt thì giữ nguyên) */
export function abbreviateName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return full.trim()
  return [parts[0], ...parts.slice(1).map((w) => (w.endsWith('.') ? w : `${w[0].toUpperCase()}.`))].join(' ')
}
