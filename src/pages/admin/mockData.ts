// Dữ liệu mẫu — thay bằng API. Tên, email, mã số thuế đều là giả.
import type { UserRole } from '@/types'

// ─── Người dùng ──────────────────────────────────────────────────────────────
export type UserStatus = 'active' | 'unverified' | 'locked'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  joinedAt: string // hiển thị trực tiếp (dd/MM/yyyy)
  status: UserStatus
  /** Trạng thái trước khi bị khóa, để mở khóa trả về đúng (vd chưa xác minh email) */
  prevStatus?: Exclude<UserStatus, 'locked'>
  lastActive: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  jobseeker: 'Người tìm việc',
  recruiter: 'Nhà tuyển dụng',
  admin: 'Quản trị viên',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Hoạt động',
  unverified: 'Chưa xác minh email',
  locked: 'Đã khóa',
}

// ─── Xác minh doanh nghiệp ───────────────────────────────────────────────────
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

interface TodoItem {
  id: string
  label: string
  detail: string
  href: string
}

export const todoItems: TodoItem[] = [
  { id: 't1', label: '4 hồ sơ doanh nghiệp chờ xác minh', detail: 'Cũ nhất gửi 21/10/2026', href: '/admin/xac-minh' },
  { id: 't2', label: '3 tin tuyển dụng bị báo cáo', detail: 'Nghi ngờ tin giả, cần xem trong ngày', href: '/admin/kiem-duyet' },
  { id: 't3', label: '6 tin mới chờ kiểm duyệt', detail: 'Từ nhà tuyển dụng chưa xác minh', href: '/admin/kiem-duyet' },
  { id: 't4', label: '2 tài khoản bị người dùng báo cáo', detail: 'Cần xem lại nội dung tin nhắn', href: '/admin/nguoi-dung' },
]

/** Số người dùng mới theo ngày, từ 17/10 đến 23/10/2026. */
export const newUsersPerDay = [
  { day: 'T7', date: '17/10', count: 54 },
  { day: 'CN', date: '18/10', count: 38 },
  { day: 'T2', date: '19/10', count: 91 },
  { day: 'T3', date: '20/10', count: 87 },
  { day: 'T4', date: '21/10', count: 103 },
  { day: 'T5', date: '22/10', count: 96 },
  { day: 'T6', date: '23/10', count: 71 },
]
