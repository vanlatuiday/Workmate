import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// KHO QUẢN TRỊ (demo) — lưu localStorage (`workmate-admin`). Còn lại ở đây: báo cáo vi phạm và ứng viên bị khóa
// (chưa có API). Phần tin tuyển dụng, kiểm duyệt, khóa/xác minh doanh nghiệp và cấu hình hệ thống đã chuyển
// sang máy chủ — xem `@context/catalogStore` và `@services/catalogService`. Đọc qua `@services/adminService`.

export type ReportTarget = 'job' | 'seeker'
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

const now = () => new Date().toISOString()
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

function seedReports(): Report[] {
  return [
    { id: 'r-seed-1', target: 'job', targetId: 'm9', reason: 'Sai thông tin', note: 'Lương thực tế thấp hơn tin đăng.', by: 'seeker', at: ago(300), status: 'open' },
    { id: 'r-seed-2', target: 'seeker', targetId: 'u12', reason: 'Không đến phỏng vấn', note: 'Đã xác nhận lịch nhưng không đến, không báo.', by: 'recruiter', at: ago(180), status: 'open' },
    { id: 'r-seed-3', target: 'job', targetId: 'm7', reason: 'Lừa đảo', note: 'Yêu cầu nộp phí trước khi làm.', by: 'guest', at: ago(1600), status: 'dismissed', resolution: 'Đã liên hệ công ty, không có phí. Báo cáo không đúng.' },
  ]
}

interface AdminState {
  /** Người tìm việc bị khóa */
  lockedSeekers: Record<string, boolean>
  reports: Report[]

  setSeekerLocked: (seekerId: string, locked: boolean) => void
  fileReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void
  resolveReport: (id: string, status: Exclude<ReportStatus, 'open'>, resolution?: string) => void
  reset: () => void
}

function seed() {
  return { lockedSeekers: {}, reports: seedReports() }
}

let seq = 0

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      ...seed(),

      setSeekerLocked: (seekerId, locked) => set((s) => ({ lockedSeekers: { ...s.lockedSeekers, [seekerId]: locked } })),
      fileReport: (r) =>
        set((s) => ({ reports: [{ ...r, id: `r${Date.now().toString(36)}${(seq++).toString(36)}`, at: now(), status: 'open' }, ...s.reports] })),
      resolveReport: (id, status, resolution) => set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, status, resolution } : r)) })),
      reset: () => set(seed()),
    }),
    {
      name: 'workmate-admin',
      version: 3,
      // v3: tin, kiểm duyệt, khóa/xác minh công ty, cấu hình đã chuyển sang máy chủ → bỏ khỏi localStorage
      migrate: (persisted) => {
        const old = (persisted ?? {}) as { lockedSeekers?: Record<string, boolean>; reports?: Report[] }
        return { lockedSeekers: old.lockedSeekers ?? {}, reports: old.reports ?? seedReports() } as unknown as AdminState
      },
      partialize: (s) => ({ lockedSeekers: s.lockedSeekers, reports: s.reports }),
    },
  ),
)
