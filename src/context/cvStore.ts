import { create } from 'zustand'
import api from '@services/api'
import { apiErrorMessage } from '@services/authService'

// CV của người tìm việc đang đăng nhập — lưu trên máy chủ (/api/seeker/cvs), file nằm ở kho riêng tư.
// Xem / tải xuống qua link ký tạm thời (5 phút) lấy bằng `fileUrl`. Không lưu bản sao trên trình duyệt.

export interface CvMeta {
  id: string
  name: string
  /** Kiểu file, vd 'application/pdf', 'image/png' */
  type: string
  size: number
  uploadedAt: string
}
type CvRow = CvMeta & { isDefault: boolean }

/** Kiểu file nhận (khớp máy chủ) */
export const CV_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
/** Tối đa 5MB / file, tối đa 5 CV */
export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_MAX_COUNT = 5

interface CvState {
  items: CvMeta[]
  defaultId: string | null
  /** Đã nạp danh sách từ máy chủ chưa (để trang hiện "Đang tải…") */
  loaded: boolean
  load: () => Promise<void>
  clear: () => void
  /** Thêm file; trả về lỗi (chuỗi) nếu không hợp lệ */
  add: (file: File) => Promise<string | null>
  remove: (id: string) => Promise<string | null>
  rename: (id: string, name: string) => Promise<string | null>
  setDefault: (id: string) => Promise<string | null>
  /** Link xem (`download` = false) hoặc tải về, hết hạn sau 5 phút */
  fileUrl: (id: string, download?: boolean) => Promise<string>
}

// Bản demo cũ lưu danh sách CV ở localStorage — dọn đi vì giờ máy chủ là nguồn duy nhất
try { localStorage.removeItem('workmate-cv') } catch { /* chế độ riêng tư */ }

const split = (rows: CvRow[]) => ({
  items: rows.map((r): CvMeta => ({ id: r.id, name: r.name, type: r.type, size: r.size, uploadedAt: r.uploadedAt })),
  defaultId: rows.find((r) => r.isDefault)?.id ?? null,
})

export const useCvStore = create<CvState>()((set, get) => {
  /** Gọi API trả về danh sách mới; lỗi → chuỗi thông báo */
  const apply = async (call: () => Promise<{ data: CvRow[] }>, fallback: string) => {
    try {
      set(split((await call()).data))
      return null
    } catch (err) {
      return apiErrorMessage(err, fallback)
    }
  }

  return {
    items: [],
    defaultId: null,
    loaded: false,

    load: async () => {
      try {
        set({ ...split((await api.get<CvRow[]>('/seeker/cvs')).data), loaded: true })
      } catch {
        set({ loaded: true })
      }
    },

    clear: () => set({ items: [], defaultId: null, loaded: false }),

    add: async (file) => {
      // Kiểm tra trước ở trình duyệt cho nhanh; máy chủ vẫn kiểm tra lại
      if (!CV_TYPES.includes(file.type)) return 'Chỉ nhận file PDF hoặc ảnh (PNG, JPG, WEBP).'
      if (file.size > CV_MAX_BYTES) return 'File lớn hơn 5MB.'
      if (get().items.length >= CV_MAX_COUNT) return `Tối đa ${CV_MAX_COUNT} CV — xóa bớt rồi tải lên.`
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await api.post<CvRow>('/seeker/cvs', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })
        const { isDefault, ...meta } = res.data
        set((s) => ({ items: [meta, ...s.items], defaultId: isDefault ? meta.id : s.defaultId }))
        return null
      } catch (err) {
        if ((err as { response?: { status?: number } }).response?.status === 413) return 'File lớn hơn 5MB.'
        return apiErrorMessage(err, 'Không tải được file lên.')
      }
    },

    remove: (id) => apply(() => api.delete<CvRow[]>(`/seeker/cvs/${id}`), 'Không xóa được CV.'),

    rename: (id, name) => {
      const v = name.trim()
      const cur = get().items.find((x) => x.id === id)
      if (!v || !cur || v === cur.name) return Promise.resolve(null)
      return apply(() => api.patch<CvRow[]>(`/seeker/cvs/${id}`, { name: v }), 'Không đổi được tên CV.')
    },

    setDefault: (id) => apply(() => api.patch<CvRow[]>(`/seeker/cvs/${id}`, { isDefault: true }), 'Không đặt được CV mặc định.'),

    fileUrl: async (id, download = false) =>
      (await api.get<{ url: string }>(`/seeker/cvs/${id}/url`, { params: download ? { download: 1 } : {} })).data.url,
  }
})
