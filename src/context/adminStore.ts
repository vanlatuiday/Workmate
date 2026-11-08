import { create } from 'zustand'
import api from '@services/api'
import type { UserRole } from '@/types'

// KHO QUẢN TRỊ — báo cáo vi phạm và ứng viên bị khóa, lưu trên máy chủ. Phần tin tuyển dụng, kiểm duyệt, khóa/xác minh doanh nghiệp và cấu hình hệ thống đã chuyển
// sang máy chủ — xem `@context/catalogStore` và `@services/catalogService`. Đọc qua `@services/adminService`.

export type ReportTarget = 'job' | 'seeker' | 'company'
export type ReportStatus = 'open' | 'dismissed' | 'actioned'

export interface Report {
  id: string
  target: ReportTarget
  /** Id tin (jobId) hoặc id người tìm việc */
  targetId: string
  reason: string
  note?: string
  /** Ai báo cáo (vai trò) */
  by: 'seeker' | 'recruiter' | 'guest'
  at: string
  status: ReportStatus
  /** Ghi chú xử lý của quản trị viên */
  resolution?: string
}

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

function seedReports(): Report[] {
  return [
    { id: 'r-seed-1', target: 'job', targetId: 'm9', reason: 'Sai thông tin', note: 'Lương thực tế thấp hơn tin đăng.', by: 'seeker', at: ago(300), status: 'open' },
    { id: 'r-seed-2', target: 'seeker', targetId: 'u12', reason: 'Không đến phỏng vấn', note: 'Đã xác nhận lịch nhưng không đến, không báo.', by: 'recruiter', at: ago(180), status: 'open' },
    { id: 'r-seed-3', target: 'job', targetId: 'm7', reason: 'Lừa đảo', note: 'Yêu cầu nộp phí trước khi làm.', by: 'guest', at: ago(1600), status: 'dismissed', resolution: 'Đã liên hệ công ty, không có phí. Báo cáo không đúng.' },
  ]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'locked'
  /** ISO */
  createdAt: string
}

interface AdminState {
  users: AdminUser[]
  loadUsers: () => Promise<void>
  /** Khóa / mở khóa bất kỳ tài khoản nào trừ quản trị viên */
  setUserLocked: (userId: string, locked: boolean) => Promise<void>
  /** Người tìm việc bị khóa */
  lockedSeekers: Record<string, boolean>
  reports: Report[]

  setSeekerLocked: (seekerId: string, locked: boolean) => Promise<void>
  /** Ai cũng gửi được, kể cả khách — nơi gọi hiện lỗi nếu máy chủ từ chối */
  fileReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => Promise<void>
  resolveReport: (id: string, status: Exclude<ReportStatus, 'open'>, resolution?: string) => Promise<void>
  loadReports: () => Promise<void>
}

// Giá trị ban đầu giữ dữ liệu mẫu cho script `db:export-demo` của backend; quản trị viên luôn nạp lại từ máy chủ
export const useAdminStore = create<AdminState>()((set) => ({
  users: [],
  loadUsers: async () => {
    const { data } = await api.get<AdminUser[]>('/admin/users')
    set({ users: data })
  },
  setUserLocked: async (userId, locked) => {
    await api.patch(`/admin/users/${encodeURIComponent(userId)}`, { locked })
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, status: locked ? 'locked' : 'active' } : u)),
      lockedSeekers: { ...s.lockedSeekers, [userId]: locked },
    }))
  },
  lockedSeekers: {},
  reports: seedReports(),

  setSeekerLocked: async (seekerId, locked) => {
    await api.patch(`/admin/seekers/${encodeURIComponent(seekerId)}`, { locked })
    set((s) => ({
      lockedSeekers: { ...s.lockedSeekers, [seekerId]: locked },
      users: s.users.map((u) => (u.id === seekerId ? { ...u, status: locked ? 'locked' : 'active' } : u)),
    }))
  },
  fileReport: async ({ target, targetId, reason, note }) => {
    await api.post('/reports', { target, targetId, reason, note })
  },
  resolveReport: async (id, status, resolution) => {
    const { data } = await api.patch<Report>(`/admin/reports/${encodeURIComponent(id)}`, { status, resolution })
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? data : r)) }))
  },
  loadReports: async () => {
    const { data } = await api.get<Report[]>('/admin/reports')
    set({ reports: data })
  },
}))
