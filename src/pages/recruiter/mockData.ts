import type { MatchBreakdown } from '@/types'

// Dữ liệu mẫu — thay bằng API. Dùng chung cho Tổng quan, Tin tuyển dụng, Ứng viên phù hợp.

export type JobStatus = 'open' | 'paused' | 'closed' | 'draft'

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

export const CRITERIA: { key: CriterionKey; label: string }[] = [
  { key: 'skills', label: 'Kỹ năng' },
  { key: 'schedule', label: 'Lịch làm việc' },
  { key: 'location', label: 'Vị trí' },
  { key: 'salary', label: 'Mức lương' },
  { key: 'experience', label: 'Kinh nghiệm' },
  { key: 'jobType', label: 'Loại việc' },
  { key: 'aspiration', label: 'Nguyện vọng' },
]

export interface MockCandidate {
  id: string
  jobId: string
  /** Tên viết tắt — thông tin liên hệ chỉ mở sau MATCH */
  name: string
  area: string
  distanceKm: number
  skills: string[]
  matchedShifts: number
  totalShifts: number
  expectedSalary: string
  score: number
  breakdown: MatchBreakdown
  /** Tiêu chí bắt buộc của tin và việc ứng viên có đạt không */
  mandatory: { label: string; ok: boolean }[]
  /** Ứng viên đã quan tâm tin này từ trước (→ MATCH khi nhà tuyển dụng quan tâm) */
  interestedBefore: boolean
}

const must = (schedule: boolean, location: boolean, skills = true) => [
  { label: 'Có thể làm đúng ca yêu cầu', ok: schedule },
  { label: 'Ở trong bán kính 8 km', ok: location },
  { label: 'Có kỹ năng cốt lõi', ok: skills },
]

export const MOCK_CANDIDATES: MockCandidate[] = [
  { id: 'c1', jobId: 'j1', name: 'Nguyễn T. H.', area: 'Hải Châu', distanceKm: 1.8, skills: ['Pha chế', 'Barista', 'Giao tiếp'], matchedShifts: 5, totalShifts: 6, expectedSalary: '30.000đ/giờ', score: 92, breakdown: { skills: 95, schedule: 90, location: 98, salary: 88, experience: 85, jobType: 100, aspiration: 80 }, mandatory: must(true, true), interestedBefore: true },
  { id: 'c2', jobId: 'j1', name: 'Trần M. K.', area: 'Thanh Khê', distanceKm: 3.2, skills: ['Pha chế', 'Thu ngân'], matchedShifts: 4, totalShifts: 6, expectedSalary: '28.000đ/giờ', score: 84, breakdown: { skills: 82, schedule: 75, location: 90, salary: 95, experience: 70, jobType: 100, aspiration: 75 }, mandatory: must(true, true), interestedBefore: false },
  { id: 'c3', jobId: 'j1', name: 'Lê Q. A.', area: 'Sơn Trà', distanceKm: 5.6, skills: ['Phục vụ', 'Giao tiếp'], matchedShifts: 3, totalShifts: 6, expectedSalary: '32.000đ/giờ', score: 71, breakdown: { skills: 60, schedule: 65, location: 72, salary: 78, experience: 55, jobType: 100, aspiration: 70 }, mandatory: must(true, true, false), interestedBefore: false },
  { id: 'c4', jobId: 'j1', name: 'Phạm T. B.', area: 'Liên Chiểu', distanceKm: 11.4, skills: ['Pha chế'], matchedShifts: 2, totalShifts: 6, expectedSalary: '35.000đ/giờ', score: 52, breakdown: { skills: 70, schedule: 40, location: 30, salary: 55, experience: 60, jobType: 80, aspiration: 50 }, mandatory: must(false, false), interestedBefore: false },
  { id: 'c5', jobId: 'j2', name: 'Võ H. N.', area: 'Hải Châu', distanceKm: 2.1, skills: ['Bán hàng', 'Chăm sóc khách hàng'], matchedShifts: 4, totalShifts: 4, expectedSalary: '28.000đ/giờ', score: 90, breakdown: { skills: 92, schedule: 100, location: 95, salary: 90, experience: 75, jobType: 100, aspiration: 85 }, mandatory: must(true, true), interestedBefore: true },
  { id: 'c6', jobId: 'j2', name: 'Đặng L. T.', area: 'Ngũ Hành Sơn', distanceKm: 6.3, skills: ['Bán hàng', 'Tiếng Anh giao tiếp'], matchedShifts: 3, totalShifts: 4, expectedSalary: '30.000đ/giờ', score: 78, breakdown: { skills: 80, schedule: 80, location: 68, salary: 82, experience: 70, jobType: 90, aspiration: 72 }, mandatory: must(true, true), interestedBefore: false },
  { id: 'c7', jobId: 'j2', name: 'Bùi A. Đ.', area: 'Cẩm Lệ', distanceKm: 7.9, skills: ['Bán hàng'], matchedShifts: 2, totalShifts: 4, expectedSalary: '26.000đ/giờ', score: 63, breakdown: { skills: 65, schedule: 55, location: 55, salary: 95, experience: 50, jobType: 90, aspiration: 60 }, mandatory: must(false, true), interestedBefore: false },
  { id: 'c8', jobId: 'j3', name: 'Hoàng M. P.', area: 'Thanh Khê', distanceKm: 2.7, skills: ['Phục vụ', 'Sự kiện'], matchedShifts: 1, totalShifts: 1, expectedSalary: '350.000đ/ngày', score: 87, breakdown: { skills: 88, schedule: 100, location: 92, salary: 95, experience: 65, jobType: 100, aspiration: 70 }, mandatory: must(true, true), interestedBefore: false },
  { id: 'c9', jobId: 'j3', name: 'Ngô T. V.', area: 'Sơn Trà', distanceKm: 4.4, skills: ['Phục vụ'], matchedShifts: 1, totalShifts: 1, expectedSalary: '400.000đ/ngày', score: 74, breakdown: { skills: 70, schedule: 100, location: 80, salary: 70, experience: 45, jobType: 90, aspiration: 65 }, mandatory: must(true, true), interestedBefore: false },
  { id: 'c10', jobId: 'j4', name: 'Đỗ K. L.', area: 'Hải Châu', distanceKm: 1.2, skills: ['Thu ngân', 'Bán hàng'], matchedShifts: 5, totalShifts: 6, expectedSalary: '7.500.000đ/tháng', score: 89, breakdown: { skills: 92, schedule: 85, location: 98, salary: 90, experience: 80, jobType: 100, aspiration: 78 }, mandatory: must(true, true), interestedBefore: true },
]

export interface MockInterview {
  id: string
  candidate: string
  job: string
  time: string
  mode: 'online' | 'onsite'
  place: string
}

export const MOCK_INTERVIEWS: MockInterview[] = [
  { id: 'i1', candidate: 'Nguyễn T. H.', job: 'Nhân viên pha chế ca tối', time: 'Thứ 2, 26/10 · 14:00', mode: 'onsite', place: 'Quán tại Hải Châu, Đà Nẵng' },
  { id: 'i2', candidate: 'Võ H. N.', job: 'Nhân viên bán hàng cuối tuần', time: 'Thứ 3, 27/10 · 09:30', mode: 'online', place: 'Cuộc gọi video trong ứng dụng' },
  { id: 'i3', candidate: 'Đỗ K. L.', job: 'Thu ngân cửa hàng tiện lợi', time: 'Thứ 4, 28/10 · 10:00', mode: 'onsite', place: 'Cửa hàng tại Hải Châu, Đà Nẵng' },
]
