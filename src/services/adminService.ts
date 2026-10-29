// Lớp dịch vụ cho khu quản trị + các quy tắc hiển thị áp lên toàn web. Đọc/ghi `@context/adminStore`;
// khi có backend, đổi ruột sang API, giữ chữ ký.
import { useAdminStore, type JobOpenStatus, type ModerationStatus, type PostedJob, type SystemConfig } from '@context/adminStore'
import { candidatesOf, RECRUITER_POSITION_JOBS, SEEKER_JOBS, type MatchCandidate, type MatchJob } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { useDemoStore } from '@context/demoStore'

export type { JobOpenStatus, ModerationStatus, PostedJob, Report, ReportStatus, ReportTarget, SystemConfig } from '@context/adminStore'
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

/** Tin có được hiện công khai không: đã duyệt, công ty không bị khóa và nhà tuyển dụng đang mở tin */
function visible(s: ReturnType<typeof useAdminStore.getState>, job: MatchJob, posted: boolean) {
  return statusOf(s, job.id, posted) === 'approved' && !s.lockedCompanies[job.companyId] && (s.jobStatus[job.id] ?? 'open') === 'open'
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
  const jobStatus = useAdminStore((s) => s.jobStatus)
  void moderation
  void jobStatus
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
  /** Trạng thái đăng tuyển do nhà tuyển dụng đặt */
  jobStatus: JobOpenStatus
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
    jobStatus: s.jobStatus[job.id] ?? 'open',
    flags: flagsOf(job, s.config),
    companyLocked: !!s.lockedCompanies[job.companyId],
  })
  return [...s.posted.map((j) => row(j, true)), ...SEEKER_JOBS.map((j) => row(j, false))]
}

export interface CompanyJobRow {
  job: MatchJob & Partial<Pick<PostedJob, 'description' | 'quantity' | 'postedAt'>>
  /** Tin mới đăng qua /dang-tin (còn lại là tin có sẵn j1–j4) */
  posted: boolean
  /** Kiểm duyệt của quản trị viên */
  status: ModerationStatus
  reason?: string
  /** Trạng thái đăng tuyển do nhà tuyển dụng đặt */
  jobStatus: JobOpenStatus
  /** Ngày đăng (ISO) — chỉ tin mới đăng có */
  postedAt?: string
}

/** Hook: tin của một công ty (j1–j4 + tin đã đăng), tin mới đăng lên đầu — cho trang Tin tuyển dụng / Tổng quan */
export function useCompanyJobs(companyId: string): CompanyJobRow[] {
  const s = useAdminStore()
  const row = (job: CompanyJobRow['job'], posted: boolean): CompanyJobRow => ({
    job,
    posted,
    status: statusOf(s, job.id, posted),
    reason: s.moderation[job.id]?.reason,
    jobStatus: s.jobStatus[job.id] ?? 'open',
    postedAt: posted ? (job as PostedJob).postedAt : undefined,
  })
  const mine = s.posted.filter((j) => j.companyId === companyId).sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  return [...mine.map((j) => row(j, true)), ...RECRUITER_POSITION_JOBS.filter((j) => j.companyId === companyId).map((j) => row(j, false))]
}

/** Điểm tối thiểu để tính là "ứng viên phù hợp" (khớp mức "Phù hợp" ở /match) */
export const FIT_MIN_SCORE = 60

/** Ứng viên đạt ≥ FIT_MIN_SCORE với một tin, điểm cao trước (cùng cách chấm với /match phía doanh nghiệp) */
export function fitCandidatesOf(job: MatchJob): { c: MatchCandidate; score: number }[] {
  return candidatesOf(job.id)
    .map((c) => ({ c, score: scoreMatch(c.criteria, job, c.distanceKm).score }))
    .filter((x) => x.score >= FIT_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
}

export interface JobNumbers {
  /** Ứng viên phù hợp (điểm ≥ 60) */
  fit: number
  /** Người tìm việc đã quan tâm/ứng tuyển tin này (kể cả đã kết nối) */
  interested: number
  /** Đã kết nối */
  connected: number
}

/** Hook: số liệu từng tin lấy từ kho demo dùng chung — khớp với /match và Kết nối */
export function useJobNumbers(jobs: MatchJob[]): Record<string, JobNumbers> {
  const interests = useDemoStore((s) => s.interests)
  const connections = useDemoStore((s) => s.connections)
  const locked = useAdminStore((s) => s.lockedSeekers)
  void locked // candidatesOf đọc thẳng kho quản trị; đăng ký để cập nhật khi khóa/mở khóa ứng viên
  return Object.fromEntries(
    jobs.map((j) => [
      j.id,
      {
        fit: fitCandidatesOf(j).length,
        interested: new Set(interests.filter((i) => i.from === 'seeker' && i.jobId === j.id).map((i) => i.seekerId)).size,
        connected: connections.filter((c) => c.jobId === j.id).length,
      },
    ]),
  )
}

/** Nhà tuyển dụng đổi trạng thái đăng tuyển: mở / tạm dừng / đã đóng */
export const setJobStatus = (jobId: string, status: JobOpenStatus) => useAdminStore.getState().setJobStatus(jobId, status)

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
