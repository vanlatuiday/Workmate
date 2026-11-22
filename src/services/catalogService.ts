// Gọi API tin tuyển dụng / doanh nghiệp / cấu hình và cập nhật `catalogStore` theo phản hồi.
// Mọi hàm ghi ném lỗi nếu máy chủ từ chối — nơi gọi hiện bằng `apiErrorMessage(err)`.
import api from './api'
import {
  useCatalogStore, type AdminJobData, type CatalogCompany, type CatalogJob, type JobOpenStatus, type ModerationStatus, type SystemConfig,
} from '@context/catalogStore'
import type { Photo } from '@components/discover/types'
import type { JobType } from '@/types'

/** Nội dung nhà tuyển dụng gửi khi đăng / sửa tin (khớp DTO của máy chủ) */
export interface JobBody {
  title: string
  description: string
  jobType: JobType
  /** Nhóm công việc (khóa trong HOME_CATEGORIES) — bắt buộc khi đăng mới */
  category: string
  district: string
  skills: string[]
  /** Kỹ năng bắt buộc, nằm trong skills */
  requiredSkills: string[]
  requireAllSlots: boolean
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
  salaryLabel?: string
  shiftLabel?: string
  quantity: number
  radiusKm: number
  photo: Photo
  /** Nhận ứng viên trong bao nhiêu ngày (đăng mới hoặc gia hạn khi sửa) */
  durationDays?: DurationDays
}

export const DURATION_DAYS = [7, 14, 30, 60] as const
export type DurationDays = (typeof DURATION_DAYS)[number]

const store = () => useCatalogStore.getState()

/** Nạp lại danh mục (và dữ liệu quản trị nếu đang là admin) — gọi khi mở web và khi đăng nhập/đăng xuất */
export async function loadCatalog(isAdmin = false): Promise<void> {
  await store().load()
  if (isAdmin) await loadAdmin()
  else store().setAdminRows(null)
}

/** Quản trị viên: danh sách tin kèm cờ + cấu hình đầy đủ (có từ cấm) */
export async function loadAdmin(): Promise<void> {
  try {
    const [rows, cfg] = await Promise.all([api.get<AdminJobData[]>('/admin/jobs'), api.get<SystemConfig>('/admin/config')])
    store().setAdminRows(rows.data)
    store().setConfig(cfg.data)
  } catch {
    /* không phải admin / mất kết nối: giữ nguyên */
  }
}

/** Kết quả tự lọc tin: duyệt ngay / giữ lại chờ duyệt / từ chối kèm các cụm cấm tìm thấy */
export interface JobReview { decision: 'approved' | 'pending' | 'rejected'; banned: string[] }
export interface RecruiterJobResult { job: CatalogJob; review: JobReview }

const splitReview = (r: CatalogJob & { review?: JobReview }): RecruiterJobResult => {
  const { review = { decision: 'pending', banned: [] }, ...job } = r
  return { job: job as CatalogJob, review }
}

export async function createJob(body: JobBody): Promise<RecruiterJobResult> {
  const res = splitReview((await api.post<CatalogJob & { review: JobReview }>('/recruiter/jobs', body)).data)
  store().upsertJob(res.job)
  return res
}

export async function updateJob(id: string, body: Partial<JobBody>): Promise<RecruiterJobResult> {
  const res = splitReview((await api.patch<CatalogJob & { review: JobReview }>(`/recruiter/jobs/${id}`, body)).data)
  store().upsertJob(res.job)
  return res
}

/** Dò trước cụm từ cấm tuyệt đối khi đang soạn. Lỗi mạng/giới hạn → danh sách rỗng, không chặn đăng tin */
export async function checkJobText(text: string): Promise<{ banned: string[] }> {
  try {
    const res = await api.post<{ banned: string[] }>('/recruiter/jobs/check', { text })
    return { banned: res.data.banned ?? [] }
  } catch {
    return { banned: [] }
  }
}

export async function setJobStatus(id: string, status: JobOpenStatus): Promise<void> {
  const res = await api.patch<CatalogJob>(`/recruiter/jobs/${id}/status`, { status })
  store().upsertJob(res.data)
}

export async function setModeration(id: string, status: ModerationStatus, reason?: string): Promise<void> {
  const res = await api.patch<AdminJobData>(`/admin/jobs/${id}/moderation`, { status, reason })
  store().upsertJob(res.data.job)
  const rows = store().adminRows
  if (rows) store().setAdminRows(rows.map((r) => (r.job.id === id ? res.data : r)))
}

/** Xác minh / khóa doanh nghiệp. Khóa đổi hiển thị của mọi tin của công ty nên nạp lại cả danh mục */
export async function patchCompany(id: string, patch: { verified?: boolean; locked?: boolean }): Promise<void> {
  const res = await api.patch<CatalogCompany>(`/admin/companies/${id}`, patch)
  store().upsertCompany(res.data)
  if (patch.locked !== undefined) await loadCatalog(true)
}

export async function saveConfig(patch: Partial<SystemConfig>): Promise<void> {
  const res = await api.put<SystemConfig>('/admin/config', patch)
  store().setConfig(res.data)
}
