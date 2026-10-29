// Dữ liệu mẫu — thay bằng API. Dùng chung cho Dashboard, Việc phù hợp và Hồ sơ.
import type { ApplicationStatus, JobType } from '@/types'

export type MockApplication = {
  id: string
  jobId: string
  title: string
  company: string
  status: ApplicationStatus
  appliedAt: string
}

export const RECENT_APPLICATIONS: MockApplication[] = [
  { id: 'dt-1', jobId: 'vl-101', title: 'Nhân viên bán hàng cuối tuần', company: 'Cửa hàng Biển Xanh', status: 'interview_invited', appliedAt: '21/10/2026' },
  { id: 'dt-2', jobId: 'vl-103', title: 'Phụ trách sự kiện khai trương', company: 'Công ty Sự kiện Mây Trắng', status: 'considering', appliedAt: '19/10/2026' },
  { id: 'dt-3', jobId: 'vl-102', title: 'Pha chế quán cà phê', company: 'Quán Gió Sông Hàn', status: 'viewed', appliedAt: '17/10/2026' },
]

/** Hồ sơ mẫu ban đầu — chỉ là hạt giống cho `context/profileStore` (nguồn thật của hồ sơ, lưu localStorage) */
export const PROFILE_DEFAULT = {
  fullName: 'Nguyễn Minh Anh',
  phone: '0905 123 456',
  area: 'Hải Châu, Đà Nẵng',
  jobTypes: ['part-time', 'event'] as JobType[],
  salaryMin: 25000,
  maxDistanceKm: 5,
  skills: ['Giao tiếp khách hàng', 'Pha chế cơ bản', 'Excel', 'Tiếng Anh giao tiếp'],
  experience: [
    { id: 'kn-1', title: 'Nhân viên phục vụ', company: 'Quán Cà Phê Hẻm Nhỏ', period: '06/2025 – 01/2026' },
    { id: 'kn-2', title: 'Cộng tác viên sự kiện', company: 'Công ty Sự kiện Mây Trắng', period: '2024 – 2025' },
  ],
}

export const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const
export const SESSIONS = ['Sáng', 'Chiều', 'Tối'] as const
/** Lịch rảnh mẫu (hạt giống của profileStore): khóa `${chỉ số ngày}-${chỉ số buổi}` được bật */
export const AVAILABILITY_DEFAULT = ['0-2', '1-2', '2-2', '3-2', '4-2', '5-0', '5-1', '6-0', '6-1']
