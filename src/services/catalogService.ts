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
  district: string
  skills: string[]
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
  salaryLabel?: string
  shiftLabel?: string
  quantity: number
  radiusKm: number
  photo: Photo
}

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

export interface RecruiterJobResult { job: CatalogJob; flags: string[] }

const splitFlags = (r: CatalogJob & { flags?: string[] }): RecruiterJobResult => {
  const { flags = [], ...job } = r
  return { job, flags }
}

export async function createJob(body: JobBody): Promise<RecruiterJobResult> {
  const res = splitFlags((await api.post<CatalogJob & { flags: string[] }>('/recruiter/jobs', body)).data)
  store().upsertJob(res.job)
  return res
}

export async function updateJob(id: string, body: Partial<JobBody>): Promise<RecruiterJobResult> {
  const res = splitFlags((await api.patch<CatalogJob & { flags: string[] }>(`/recruiter/jobs/${id}`, body)).data)
  store().upsertJob(res.job)
  return res
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
