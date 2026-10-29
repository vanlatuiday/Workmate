import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatchJob } from '@pages/public/match/data'
import type { CriterionKey } from '@pages/public/match/score'

// KHO QUẢN TRỊ (demo) — lưu localStorage (`workmate-admin`). Thao tác của quản trị viên có tác dụng
// thật trên web: tin bị ẩn/chưa duyệt không hiện ở Việc làm, Kết nối; nhà tuyển dụng bị khóa thì mọi
// tin của họ ẩn theo; ứng viên bị khóa không hiện cho doanh nghiệp. Đọc qua `@services/adminService`.

/** pending = chờ duyệt (tin mới đăng) · approved = đang hiện · rejected = bị từ chối · hidden = quản trị viên ẩn */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

export interface Moderation {
  status: ModerationStatus
  /** Lý do từ chối / ẩn */
  reason?: string
  at: string
}

/** Tin đăng mới từ /dang-tin — vào hàng chờ duyệt trước khi hiện công khai */
export interface PostedJob extends MatchJob {
  description: string
  quantity: number
  radiusKm: number
  postedAt: string
}

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

export interface SystemConfig {
  /** Trọng số mặc định (%) của 5 tiêu chí — tổng nên = 100; dùng khi người dùng không tự xếp ưu tiên */
  weights: Record<CriterionKey, number>
  /** Từ cấm: tin chứa từ này bị tự gắn cờ */
  bannedWords: string[]
  /** Lương thấp hơn mức này (nghìn đồng/giờ) bị gắn cờ */
  minWageK: number
  /** Bán kính tuyển mặc định khi đăng tin (km) */
  defaultRadiusKm: number
  /** Mở đăng ký tài khoản mới */
  registrationOpen: boolean
}

export const DEFAULT_CONFIG: SystemConfig = {
  weights: { skills: 35, schedule: 25, salary: 16, distance: 14, jobType: 10 },
  bannedWords: ['đặt cọc', 'phí giữ chỗ', 'việc nhẹ lương cao', 'chuyển khoản trước'],
  minWageK: 20,
  defaultRadiusKm: 8,
  registrationOpen: true,
}

const now = () => new Date().toISOString()
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

/** Tin mẫu đang chờ duyệt — một tin bình thường, hai tin bị gắn cờ, để hàng chờ không trống */
function seedPosted(): PostedJob[] {
  const base = { companyId: 'song-han', district: 'Hải Châu', distanceKm: 2.0, radiusKm: 8, quantity: 2 }
  return [
    {
      ...base, id: 'p-seed-1', title: 'Phụ quầy cà phê buổi sáng', salaryLabel: '27.000–30.000đ/giờ', shiftLabel: 'Sáng T2–T6',
      skills: ['Pha chế cơ bản', 'Giao tiếp khách hàng'], slots: ['0-0', '1-0', '2-0', '3-0', '4-0'], salaryMinK: 27, salaryMaxK: 30, jobType: 'part-time',
      photo: { id: '1442512595331-e89e73853f31', alt: 'Pha cà phê bằng phễu lọc' },
      description: 'Hỗ trợ quầy pha chế giờ cao điểm buổi sáng, được hướng dẫn từ đầu.', postedAt: ago(40),
    },
    {
      ...base, id: 'p-seed-2', title: 'Cộng tác viên bán hàng online tại nhà', salaryLabel: '15.000đ/giờ', shiftLabel: 'Linh hoạt',
      skills: [], slots: [], salaryMinK: 15, salaryMaxK: 15, jobType: 'freelance',
      photo: { id: '1497366811353-6870744d04b2', alt: 'Văn phòng trống với bàn họp dài' },
      description: 'Việc nhẹ lương cao, chỉ cần đặt cọc 200.000đ để nhận hàng mẫu.', postedAt: ago(25),
    },
    {
      ...base, id: 'p-seed-3', title: 'Phục vụ tiệc cuối tuần', salaryLabel: '350.000đ/ngày', shiftLabel: 'Tối T7, CN',
      skills: ['Phục vụ bàn'], slots: ['5-2', '6-2'], salaryMinK: 40, salaryMaxK: 45, jobType: 'event',
      photo: { id: '1511795409834-ef04bbd61622', alt: 'Bàn tiệc dài trang trí hoa' },
      description: '', postedAt: ago(10),
    },
  ]
}

function seedReports(): Report[] {
  return [
    { id: 'r-seed-1', target: 'job', targetId: 'm9', reason: 'Sai thông tin', note: 'Lương thực tế thấp hơn tin đăng.', by: 'seeker', at: ago(300), status: 'open' },
    { id: 'r-seed-2', target: 'seeker', targetId: 'u12', reason: 'Không đến phỏng vấn', note: 'Đã xác nhận lịch nhưng không đến, không báo.', by: 'recruiter', at: ago(180), status: 'open' },
    { id: 'r-seed-3', target: 'job', targetId: 'm7', reason: 'Lừa đảo', note: 'Yêu cầu nộp phí trước khi làm.', by: 'guest', at: ago(1600), status: 'dismissed', resolution: 'Đã liên hệ công ty, không có phí. Báo cáo không đúng.' },
  ]
}

interface AdminState {
  moderation: Record<string, Moderation>
  posted: PostedJob[]
  /** Nhà tuyển dụng (theo id công ty) bị khóa */
  lockedCompanies: Record<string, boolean>
  /** Công ty đã xác minh (gắn nhãn) */
  verifiedCompanies: Record<string, boolean>
  /** Người tìm việc bị khóa */
  lockedSeekers: Record<string, boolean>
  reports: Report[]
  config: SystemConfig

  /** Đăng tin mới (từ /dang-tin) → chờ duyệt */
  submitJob: (job: Omit<PostedJob, 'id' | 'postedAt'>) => string
  setModeration: (jobId: string, status: ModerationStatus, reason?: string) => void
  setCompanyLocked: (companyId: string, locked: boolean) => void
  setCompanyVerified: (companyId: string, verified: boolean) => void
  setSeekerLocked: (seekerId: string, locked: boolean) => void
  fileReport: (r: Omit<Report, 'id' | 'at' | 'status'>) => void
  resolveReport: (id: string, status: Exclude<ReportStatus, 'open'>, resolution?: string) => void
  updateConfig: (patch: Partial<SystemConfig>) => void
  reset: () => void
}

function seed() {
  const posted = seedPosted()
  return {
    moderation: Object.fromEntries(posted.map((p) => [p.id, { status: 'pending' as const, at: p.postedAt }])),
    posted,
    lockedCompanies: {},
    verifiedCompanies: { 'gio-song-han': true, 'bien-xanh': true, 'may-trang': true, 'hoa-sua': true },
    lockedSeekers: {},
    reports: seedReports(),
    config: DEFAULT_CONFIG,
  }
}

let seq = 0

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      ...seed(),

      submitJob: (job) => {
        const id = `p${Date.now().toString(36)}${(seq++).toString(36)}`
        const at = now()
        set((s) => ({ posted: [...s.posted, { ...job, id, postedAt: at }], moderation: { ...s.moderation, [id]: { status: 'pending', at } } }))
        return id
      },
      setModeration: (jobId, status, reason) => set((s) => ({ moderation: { ...s.moderation, [jobId]: { status, reason, at: now() } } })),
      setCompanyLocked: (companyId, locked) => set((s) => ({ lockedCompanies: { ...s.lockedCompanies, [companyId]: locked } })),
      setCompanyVerified: (companyId, verified) => set((s) => ({ verifiedCompanies: { ...s.verifiedCompanies, [companyId]: verified } })),
      setSeekerLocked: (seekerId, locked) => set((s) => ({ lockedSeekers: { ...s.lockedSeekers, [seekerId]: locked } })),
      fileReport: (r) =>
        set((s) => ({ reports: [{ ...r, id: `r${Date.now().toString(36)}${(seq++).toString(36)}`, at: now(), status: 'open' }, ...s.reports] })),
      resolveReport: (id, status, resolution) => set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, status, resolution } : r)) })),
      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      reset: () => set(seed()),
    }),
    {
      name: 'workmate-admin',
      version: 1,
      partialize: (s) => ({
        moderation: s.moderation,
        posted: s.posted,
        lockedCompanies: s.lockedCompanies,
        verifiedCompanies: s.verifiedCompanies,
        lockedSeekers: s.lockedSeekers,
        reports: s.reports,
        config: s.config,
      }),
    },
  ),
)
