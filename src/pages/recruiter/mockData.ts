import type { MatchBreakdown } from '@/types'

// Dữ liệu mẫu — thay bằng API. Dùng chung cho Tổng quan, Tin tuyển dụng, Ứng viên phù hợp.

type JobStatus = 'open' | 'paused' | 'closed' | 'draft'

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Đang mở',
  paused: 'Tạm dừng',
  closed: 'Đã đóng',
  draft: 'Nháp',
}

export interface MockJob {
  id: string
  title: string
  jobType: string
  schedule: string
  salary: string
  postedAt: string
  views: number
  suggested: number
  matches: number
  status: JobStatus
}

export const MOCK_JOBS: MockJob[] = [
  { id: 'j1', title: 'Nhân viên pha chế ca tối', jobType: 'Theo ca', schedule: 'Ca tối 17:00–22:00, T2–T7', salary: '30.000đ/giờ', postedAt: '12/10/2026', views: 214, suggested: 12, matches: 3, status: 'open' },
  { id: 'j2', title: 'Nhân viên bán hàng cuối tuần', jobType: 'Bán thời gian', schedule: 'Ca sáng và chiều, T7–CN', salary: '28.000đ/giờ', postedAt: '09/10/2026', views: 168, suggested: 9, matches: 2, status: 'open' },
  { id: 'j3', title: 'Phục vụ sự kiện tiệc cưới', jobType: 'Sự kiện', schedule: 'Theo lịch sự kiện, tối T7', salary: '350.000đ/ngày', postedAt: '02/10/2026', views: 97, suggested: 5, matches: 1, status: 'open' },
  { id: 'j4', title: 'Thu ngân cửa hàng tiện lợi', jobType: 'Toàn thời gian', schedule: '3 ca xoay vòng, 6 ngày/tuần', salary: '7.500.000đ/tháng', postedAt: '25/09/2026', views: 143, suggested: 7, matches: 0, status: 'paused' },
  { id: 'j5', title: 'Cộng tác viên giao hàng nội thành', jobType: 'Cộng tác viên', schedule: 'Linh hoạt theo đơn', salary: 'Hoa hồng', postedAt: '10/09/2026', views: 301, suggested: 0, matches: 4, status: 'closed' },
  { id: 'j6', title: 'Trợ lý marketing thời vụ', jobType: 'Thời vụ', schedule: 'Chưa chốt lịch', salary: 'Thỏa thuận', postedAt: '—', views: 0, suggested: 0, matches: 0, status: 'draft' },
]

export type CriterionKey = keyof MatchBreakdown
