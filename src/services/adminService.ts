// Lớp dịch vụ cho khu quản trị + các quy tắc hiển thị áp lên toàn web. Đọc/ghi `@context/adminStore`;
// khi có backend, đổi ruột sang API, giữ chữ ký.
import { useAdminStore, type ModerationStatus, type PostedJob, type SystemConfig } from '@context/adminStore'
import { SEEKER_JOBS, type MatchJob } from '@pages/public/match/data'

export type { ModerationStatus, PostedJob, Report, ReportStatus, ReportTarget, SystemConfig } from '@context/adminStore'
export { DEFAULT_CONFIG } from '@context/adminStore'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** Lý do tự gắn cờ cho một tin (rỗng = không có gì đáng ngờ) */
export function flagsOf(job: MatchJob & { description?: string }, config: SystemConfig): string[] {
  const flags: string[] = []
  if (job.salaryMaxK > 0 && job.salaryMaxK < config.minWageK) flags.push(`Lương thấp bất thường (dưới ${config.minWageK}.000đ/giờ)`)
  if (!job.skills.length) flags.push('Chưa nêu kỹ năng cần có')
  if (!job.slots.length) flags.push('Chưa nêu ca làm')
  if ('description' in job && !job.description?.trim()) flags.push('Thiếu mô tả công việc')
  const text = norm([job.title, job.description ?? ''].join(' '))
  const hits = config.bannedWords.filter((w) => w.trim() && text.includes(norm(w)))
  if (hits.length) flags.push(`Chứa từ cấm: ${hits.join(', ')}`)
  return flags
}

/** Trạng thái kiểm duyệt của một tin: tin có sẵn mặc định "approved", tin mới đăng mặc định "pending" */
function statusOf(s: ReturnType<typeof useAdminStore.getState>, jobId: string, posted: boolean): ModerationStatus {
  return s.moderation[jobId]?.status ?? (posted ? 'pending' : 'approved')
}

/** Tin có được hiện công khai không: đã duyệt và công ty không bị khóa */
function visible(s: ReturnType<typeof useAdminStore.getState>, job: MatchJob, posted: boolean) {
  return statusOf(s, job.id, posted) === 'approved' && !s.lockedCompanies[job.companyId]
}

/** Mọi tin đang hiện công khai (tin có sẵn + tin mới đã duyệt) — đọc tức thời */
export function getVisibleJobs(): MatchJob[] {
  const s = useAdminStore.getState()
  return [...SEEKER_JOBS.filter((j) => visible(s, j, false)), ...s.posted.filter((j) => visible(s, j, true))]
}

/** Hook: như getVisibleJobs nhưng tự cập nhật khi quản trị viên duyệt/ẩn/khóa */
export function useVisibleJobs(): MatchJob[] {
  const moderation = useAdminStore((s) => s.moderation)
  const posted = useAdminStore((s) => s.posted)
  const locked = useAdminStore((s) => s.lockedCompanies)
  void moderation
  void posted
  void locked
  return getVisibleJobs()
}

/** Người tìm việc có bị khóa không (ẩn khỏi danh sách của doanh nghiệp) */
export const isSeekerLocked = (seekerId: string) => !!useAdminStore.getState().lockedSeekers[seekerId]

export interface AdminJobRow {
  job: MatchJob & Partial<Pick<PostedJob, 'description' | 'quantity' | 'postedAt'>>
  /** Tin mới đăng qua /dang-tin */
  posted: boolean
  status: ModerationStatus
  reason?: string
  flags: string[]
  companyLocked: boolean
}

/** Hook: mọi tin (kể cả ẩn/chờ/từ chối) kèm trạng thái + cờ — cho Kiểm duyệt và Tin tuyển dụng */
export function useAdminJobs(): AdminJobRow[] {
  const s = useAdminStore()
  const row = (job: AdminJobRow['job'], posted: boolean): AdminJobRow => ({
    job,
    posted,
    status: statusOf(s, job.id, posted),
    reason: s.moderation[job.id]?.reason,
    flags: flagsOf(job, s.config),
    companyLocked: !!s.lockedCompanies[job.companyId],
  })
  return [...s.posted.map((j) => row(j, true)), ...SEEKER_JOBS.map((j) => row(j, false))]
}

/** Gửi tin mới từ /dang-tin vào hàng chờ duyệt; trả về id */
export const submitJob = (job: Omit<PostedJob, 'id' | 'postedAt'>) => useAdminStore.getState().submitJob(job)
export const setModeration = (jobId: string, status: ModerationStatus, reason?: string) =>
  useAdminStore.getState().setModeration(jobId, status, reason)
export const setCompanyLocked = (id: string, locked: boolean) => useAdminStore.getState().setCompanyLocked(id, locked)
export const setCompanyVerified = (id: string, v: boolean) => useAdminStore.getState().setCompanyVerified(id, v)
export const setSeekerLocked = (id: string, locked: boolean) => useAdminStore.getState().setSeekerLocked(id, locked)
export const fileReport = (r: Parameters<ReturnType<typeof useAdminStore.getState>['fileReport']>[0]) =>
  useAdminStore.getState().fileReport(r)
export const resolveReport = (...a: Parameters<ReturnType<typeof useAdminStore.getState>['resolveReport']>) =>
  useAdminStore.getState().resolveReport(...a)
export const updateConfig = (patch: Partial<SystemConfig>) => useAdminStore.getState().updateConfig(patch)
export const resetAdminData = () => useAdminStore.getState().reset()

/** Hook đọc thẳng các phần của kho quản trị (danh sách khóa/xác minh, báo cáo, cấu hình) */
export const useAdmin = useAdminStore
