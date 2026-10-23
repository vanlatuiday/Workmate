// Dữ liệu mẫu — thay bằng API. Dùng chung cho Dashboard, Việc phù hợp và Hồ sơ.
import type { ApplicationStatus, JobType, MatchBreakdown } from '@/types'

export type MockJob = {
  id: string
  title: string
  company: string
  district: string
  distanceKm: number
  /** Lương hiển thị + giá trị quy ra nghìn đồng/giờ để sắp xếp (ước lượng) */
  salaryLabel: string
  salarySort: number
  jobType: JobType
  shift: string
  score: number
  breakdown: MatchBreakdown
}

// TODO: link `/viec-lam/:id` hiện mở trang chi tiết mẫu (JobDetailPage chưa đọc `id`), nên nội dung không khớp tin.
// Giữ link để dựng luồng; khi có API chi tiết tin thì JobDetailPage đọc id từ URL.
export const RECOMMENDED_JOBS: MockJob[] = [
  {
    id: 'vl-101', title: 'Nhân viên bán hàng cuối tuần', company: 'Cửa hàng Biển Xanh', district: 'Hải Châu',
    distanceKm: 1.8, salaryLabel: '28.000đ – 32.000đ/giờ', salarySort: 30, jobType: 'part-time',
    shift: 'Thứ 7, CN · 13:00 – 21:00', score: 92,
    breakdown: { skills: 95, schedule: 100, location: 92, salary: 85, experience: 90, jobType: 100, aspiration: 80 },
  },
  {
    id: 'vl-102', title: 'Pha chế quán cà phê', company: 'Quán Gió Sông Hàn', district: 'Sơn Trà',
    distanceKm: 3.4, salaryLabel: '4.500.000đ – 5.500.000đ/tháng', salarySort: 28, jobType: 'part-time',
    shift: 'T2–T6 · 17:00 – 22:00', score: 87,
    breakdown: { skills: 82, schedule: 90, location: 80, salary: 88, experience: 85, jobType: 100, aspiration: 90 },
  },
  {
    id: 'vl-103', title: 'Phụ trách sự kiện khai trương', company: 'Công ty Sự kiện Mây Trắng', district: 'Thanh Khê',
    distanceKm: 4.2, salaryLabel: '350.000đ/ngày', salarySort: 44, jobType: 'event',
    shift: 'Theo lịch sự kiện · 2 ngày', score: 81,
    breakdown: { skills: 75, schedule: 70, location: 78, salary: 95, experience: 80, jobType: 85, aspiration: 88 },
  },
  {
    id: 'vl-104', title: 'Trợ lý marketing thực tập', company: 'Studio Cánh Buồm', district: 'Hải Châu',
    distanceKm: 2.1, salaryLabel: 'Thỏa thuận', salarySort: 0, jobType: 'full-time',
    shift: 'T2–T6 · 08:30 – 17:30', score: 68,
    breakdown: { skills: 72, schedule: 45, location: 90, salary: 60, experience: 65, jobType: 40, aspiration: 75 },
  },
  {
    id: 'vl-105', title: 'Nhân viên giao hàng nội thành', company: 'Giao Nhanh Đà Thành', district: 'Cẩm Lệ',
    distanceKm: 6.5, salaryLabel: '25.000đ/giờ + thưởng chuyến', salarySort: 25, jobType: 'shift',
    shift: 'Ca sáng hoặc ca tối', score: 63,
    breakdown: { skills: 55, schedule: 80, location: 55, salary: 70, experience: 60, jobType: 70, aspiration: 50 },
  },
  {
    id: 'vl-106', title: 'Gia sư tiếng Anh giao tiếp', company: 'Trung tâm Ngôn Ngữ Hoa Sữa', district: 'Ngũ Hành Sơn',
    distanceKm: 8.9, salaryLabel: '120.000đ/giờ', salarySort: 120, jobType: 'freelance',
    shift: 'Tối T3, T5, T7', score: 55,
    breakdown: { skills: 60, schedule: 65, location: 40, salary: 90, experience: 45, jobType: 55, aspiration: 35 },
  },
  {
    id: 'vl-107', title: 'Nhân viên phục vụ nhà hàng hải sản', company: 'Nhà hàng Sóng Vỗ', district: 'Sơn Trà',
    distanceKm: 5.7, salaryLabel: '24.000đ/giờ', salarySort: 24, jobType: 'seasonal',
    shift: 'Mùa cao điểm · 16:00 – 23:00', score: 48,
    breakdown: { skills: 50, schedule: 40, location: 62, salary: 55, experience: 40, jobType: 45, aspiration: 42 },
  },
]

/** Tiêu chí phân rã khớp MATCH_WEIGHTS */
export const MATCH_CRITERIA: { key: keyof MatchBreakdown; label: string }[] = [
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'schedule', label: 'Lịch làm việc' },
  { key: 'location', label: 'Vị trí' },
  { key: 'salary', label: 'Mức lương' },
  { key: 'experience', label: 'Kinh nghiệm' },
  { key: 'jobType', label: 'Loại việc' },
  { key: 'aspiration', label: 'Nguyện vọng' },
]

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

export const DASHBOARD_STATS = { applied: 12, viewed: 7, saved: 5, match: 3 }

/** Hồ sơ mẫu để điền sẵn form */
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
/** Lịch rảnh mẫu: khóa `${chỉ số ngày}-${chỉ số buổi}` được bật */
export const AVAILABILITY_DEFAULT = ['0-2', '1-2', '2-2', '3-2', '4-2', '5-0', '5-1', '6-0', '6-1']
