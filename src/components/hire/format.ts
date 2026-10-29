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
