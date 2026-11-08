// Lớp dịch vụ cho khu quản trị + các quy tắc hiển thị áp lên toàn web. Đọc/ghi `@context/adminStore`;
// tin / công ty / cấu hình đọc từ `@context/catalogStore` (nạp từ API), thao tác ghi gọi `@services/catalogService`.
import { useMemo } from 'react'
import { useAdminStore } from '@context/adminStore'
import { useCatalogStore, type CatalogJob, type JobOpenStatus, type ModerationStatus, type SystemConfig } from '@context/catalogStore'
import { candidatesOf, type MatchCandidate, type MatchJob } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { useConnectionStore } from '@context/connectionStore'
import { useCandidateStore } from '@context/candidateStore'
import toast from 'react-hot-toast'
import * as catalogApi from './catalogService'
import { apiErrorMessage } from './authService'

export type { JobOpenStatus, ModerationStatus, SystemConfig } from '@context/catalogStore'
export type { Report, ReportStatus, ReportTarget } from '@context/adminStore'
export { DEFAULT_CONFIG } from '@context/catalogStore'

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

/** Mọi tin đang hiện công khai (đã duyệt, đang mở, công ty không bị khóa) — đọc tức thời từ danh mục */
export function getVisibleJobs(): MatchJob[] {
  return useCatalogStore.getState().jobs.filter((j) => j.visible)
}

/** Hook: như getVisibleJobs nhưng tự cập nhật khi danh mục đổi (nạp lại, quản trị duyệt/ẩn/khóa) */
export function useVisibleJobs(): MatchJob[] {
  const jobs = useCatalogStore((s) => s.jobs)
  return useMemo(() => jobs.filter((j) => j.visible), [jobs])
}

/** Người tìm việc có bị khóa không (ẩn khỏi danh sách của doanh nghiệp) */
export const isSeekerLocked = (seekerId: string) => !!useAdminStore.getState().lockedSeekers[seekerId]

/** Tin do người dùng đăng (id sinh tự động) khác với tin mẫu có sẵn (m1…, j1…, p-seed-…) */
const isSampleId = (id: string) => /^([mj]\d+|p-seed-\d+)$/.test(id)

export interface AdminJobRow {
  job: CatalogJob
  /** Tin do nhà tuyển dụng đăng (không phải tin mẫu) */
  posted: boolean
  status: ModerationStatus
  reason?: string
  /** Trạng thái đăng tuyển do nhà tuyển dụng đặt */
  jobStatus: JobOpenStatus
  flags: string[]
  companyLocked: boolean
}

/** Hook: mọi tin (kể cả ẩn/chờ/từ chối) kèm trạng thái + cờ — cho Kiểm duyệt và Tin tuyển dụng.
 *  Quản trị viên: lấy từ GET /admin/jobs; chưa nạp được thì tự tính từ danh mục. */
export function useAdminJobs(): AdminJobRow[] {
  const adminRows = useCatalogStore((s) => s.adminRows)
  const jobs = useCatalogStore((s) => s.jobs)
  const companies = useCatalogStore((s) => s.companies)
  const config = useCatalogStore((s) => s.config)
  return useMemo(() => {
    const rows = adminRows ?? jobs.map((job) => ({ job, flags: flagsOf(job, config), companyLocked: !!companies.find((c) => c.id === job.companyId)?.locked }))
    return rows.map((r) => ({
      job: r.job, posted: !isSampleId(r.job.id), status: r.job.moderation, reason: r.job.moderationReason,
      jobStatus: r.job.status, flags: r.flags, companyLocked: r.companyLocked,
    }))
  }, [adminRows, jobs, companies, config])
}

/** Hook: danh sách công ty + hai bảng tra nhanh theo id (đã xác minh / bị khóa) */
export function useCompanyFlags(): { verified: Record<string, boolean>; locked: Record<string, boolean> } {
  const companies = useCatalogStore((s) => s.companies)
  return useMemo(
    () => ({
      verified: Object.fromEntries(companies.map((c) => [c.id, c.verified])),
      locked: Object.fromEntries(companies.map((c) => [c.id, c.locked])),
    }),
    [companies],
  )
}

export interface CompanyJobRow {
  job: CatalogJob
  /** Tin có thể sửa qua /dang-tin (mọi tin của công ty — máy chủ cho sửa tin của chính công ty) */
  posted: boolean
  /** Kiểm duyệt của quản trị viên */
  status: ModerationStatus
  reason?: string
  /** Trạng thái đăng tuyển do nhà tuyển dụng đặt */
  jobStatus: JobOpenStatus
  /** Ngày đăng (ISO) */
  postedAt?: string
}

/** Hook: tin của một công ty (mọi trạng thái, đã nạp theo tài khoản nhà tuyển dụng), mới nhất lên đầu */
export function useCompanyJobs(companyId: string): CompanyJobRow[] {
  const jobs = useCatalogStore((s) => s.jobs)
  return useMemo(
    () =>
      jobs
        .filter((j) => j.companyId === companyId)
        .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
        .map((job) => ({ job, posted: true, status: job.moderation, reason: job.moderationReason, jobStatus: job.status, postedAt: job.postedAt })),
    [jobs, companyId],
  )
}

/** Điểm tối thiểu để tính là "ứng viên phù hợp" (khớp mức "Phù hợp" ở /match) */
export const FIT_MIN_SCORE = 60

/** Ứng viên đạt ≥ FIT_MIN_SCORE với một tin, điểm cao trước (cùng cách chấm với /match phía doanh nghiệp) */
export function fitCandidatesOf(job: MatchJob): { c: MatchCandidate; score: number }[] {
  return candidatesOf()
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

/** Hook: số liệu từng tin — khớp với /match và Kết nối */
export function useJobNumbers(jobs: MatchJob[]): Record<string, JobNumbers> {
  const interests = useConnectionStore((s) => s.interests)
  const connections = useConnectionStore((s) => s.connections)
  useCandidateStore((s) => s.list) // fitCandidatesOf đọc thẳng kho ứng viên; đăng ký để tính lại khi nạp xong
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

/** Bọc thao tác ghi gọi máy chủ: nơi gọi không cần chờ; máy chủ từ chối / mất kết nối thì báo lỗi bằng toast */
const reportErrors =
  <A extends unknown[]>(fn: (...a: A) => Promise<void>) =>
  (...a: A): Promise<void> =>
    fn(...a).catch((err: unknown) => {
      toast.error(apiErrorMessage(err, 'Chưa lưu được thay đổi, vui lòng thử lại.'))
    })

/** Nhà tuyển dụng đổi trạng thái đăng tuyển: mở / tạm dừng / đã đóng */
export const setJobStatus = reportErrors(catalogApi.setJobStatus)
/** Quản trị: duyệt / từ chối / ẩn / khôi phục tin */
export const setModeration = reportErrors(catalogApi.setModeration)
export const setCompanyLocked = reportErrors((id: string, locked: boolean) => catalogApi.patchCompany(id, { locked }))
export const setCompanyVerified = reportErrors((id: string, verified: boolean) => catalogApi.patchCompany(id, { verified }))
export const setSeekerLocked = reportErrors((id: string, locked: boolean) => useAdminStore.getState().setSeekerLocked(id, locked))
export const fileReport = (r: Parameters<ReturnType<typeof useAdminStore.getState>['fileReport']>[0]) =>
  useAdminStore.getState().fileReport(r)
export const resolveReport = reportErrors((...a: Parameters<ReturnType<typeof useAdminStore.getState>['resolveReport']>) =>
  useAdminStore.getState().resolveReport(...a))
export const updateConfig = (patch: Partial<SystemConfig>) => catalogApi.saveConfig(patch)

/** Hook đọc thẳng các phần của kho quản trị (báo cáo, ứng viên bị khóa) */
export const useAdmin = useAdminStore
