// Logo công ty của nhà tuyển dụng (/api/recruiter/company/logo). Hàm trả về chuỗi lỗi tiếng Việt, hoặc null nếu xong.
import api from './api'
import { apiErrorMessage } from './authService'
import { useCompanyStore } from '@context/companyStore'
import { useCatalogStore } from '@context/catalogStore'

export const LOGO_MAX_BYTES = 2 * 1024 * 1024
export const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Kiểm tra phía client trước khi gửi; trả về thông báo lỗi hoặc null nếu hợp lệ */
export function checkLogoFile(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) return 'Chỉ nhận ảnh JPG, PNG hoặc WEBP.'
  if (file.size > LOGO_MAX_BYTES) return 'Ảnh lớn hơn 2MB.'
  return null
}

type LogoResponse = { logoUrl: string | null }

async function apply(res: LogoResponse) {
  useCompanyStore.getState().setLogoUrl(res.logoUrl ?? null)
  // Trang công khai đọc logo từ danh mục
  await useCatalogStore.getState().load().catch(() => undefined)
}

export async function uploadCompanyLogo(file: File): Promise<string | null> {
  const bad = checkLogoFile(file)
  if (bad) return bad
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await api.post<LogoResponse>('/recruiter/company/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    await apply(res.data)
    return null
  } catch (err) {
    if ((err as { response?: { status?: number } }).response?.status === 413) return 'Ảnh lớn hơn 2MB.'
    return apiErrorMessage(err, 'Không tải được logo lên.')
  }
}

export async function removeCompanyLogo(): Promise<string | null> {
  try {
    const res = await api.delete<LogoResponse>('/recruiter/company/logo')
    await apply(res.data)
    return null
  } catch (err) {
    return apiErrorMessage(err, 'Không xóa được logo.')
  }
}

// ---- Xác minh doanh nghiệp (/api/recruiter/company/verification) ----
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export interface VerificationDoc { id: string; name: string; type: string; size: number }
export interface Verification {
  id: string
  status: VerificationStatus
  note: string
  rejectReason: string | null
  submittedAt: string
  reviewedAt: string | null
  documents: VerificationDoc[]
}
export interface VerificationState { verified: boolean; latest: Verification | null }

export const VERIFY_MAX_FILES = 5
export const VERIFY_MAX_BYTES = 5 * 1024 * 1024
export const VERIFY_NOTE_MAX = 1000
export const VERIFY_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

/** Kiểm tra danh sách file sẽ gửi (số lượng, loại, dung lượng); trả về lỗi hoặc null */
export function checkVerificationFiles(files: File[]): string | null {
  if (files.length === 0) return 'Chọn ít nhất một giấy tờ.'
  if (files.length > VERIFY_MAX_FILES) return `Tối đa ${VERIFY_MAX_FILES} tệp.`
  for (const f of files) {
    if (!VERIFY_TYPES.includes(f.type)) return `“${f.name}” không đúng định dạng (chỉ nhận PDF, PNG, JPG, WEBP).`
    if (f.size > VERIFY_MAX_BYTES) return `“${f.name}” lớn hơn 5MB.`
  }
  return null
}

const statusOf = (err: unknown) => (err as { response?: { status?: number } }).response?.status

/** Nạp lại danh mục khi công ty đã được xác minh để nhãn hiện ở trang công khai */
async function refreshIfVerified(verified: boolean) {
  if (verified) await useCatalogStore.getState().load().catch(() => undefined)
}

export async function fetchVerification(): Promise<{ data: VerificationState | null; error: string | null }> {
  try {
    const res = await api.get<VerificationState>('/recruiter/company/verification')
    await refreshIfVerified(res.data.verified)
    return { data: res.data, error: null }
  } catch (err) {
    return { data: null, error: apiErrorMessage(err, 'Không tải được trạng thái xác minh.') }
  }
}

export async function submitVerification(files: File[], note: string): Promise<string | null> {
  const bad = checkVerificationFiles(files)
  if (bad) return bad
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  if (note.trim()) form.append('note', note.trim())
  try {
    await api.post<Verification>('/recruiter/company/verification', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return null
  } catch (err) {
    if (statusOf(err) === 413) return 'Có tệp lớn hơn 5MB.'
    return apiErrorMessage(err, 'Không gửi được yêu cầu xác minh.')
  }
}

export async function withdrawVerification(): Promise<string | null> {
  try {
    await api.delete<VerificationState>('/recruiter/company/verification')
    return null
  } catch (err) {
    return apiErrorMessage(err, 'Không rút được yêu cầu.')
  }
}
