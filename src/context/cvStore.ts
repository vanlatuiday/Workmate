import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deleteFile, putFile } from '@utils/fileStore'

// CV của người tìm việc demo: danh sách (tên, dung lượng, mặc định) lưu localStorage (`workmate-cv`),
// nội dung file lưu IndexedDB (`@utils/fileStore`, khóa = id). Chỉ trên máy/trình duyệt này.

export interface CvMeta {
  id: string
  name: string
  /** Kiểu file, vd 'application/pdf', 'image/png' */
  type: string
  size: number
  uploadedAt: string
}

/** Kiểu file nhận */
export const CV_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
/** Tối đa 5MB / file, tối đa 5 CV */
export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_MAX_COUNT = 5

interface CvState {
  items: CvMeta[]
  defaultId: string | null
  /** Thêm file; trả về lỗi (chuỗi) nếu không hợp lệ */
  add: (file: File) => Promise<string | null>
  remove: (id: string) => Promise<void>
  rename: (id: string, name: string) => void
  setDefault: (id: string) => void
}

export const useCvStore = create<CvState>()(
  persist(
    (set, get) => ({
      items: [],
      defaultId: null,

      add: async (file) => {
        if (!CV_TYPES.includes(file.type)) return 'Chỉ nhận file PDF hoặc ảnh (PNG, JPG, WEBP).'
        if (file.size > CV_MAX_BYTES) return 'File lớn hơn 5MB.'
        if (get().items.length >= CV_MAX_COUNT) return `Tối đa ${CV_MAX_COUNT} CV — xóa bớt rồi tải lên.`
        const id = `cv${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        try {
          await putFile(id, file)
        } catch {
          return 'Trình duyệt không cho lưu file (có thể đang ở chế độ riêng tư).'
        }
        const meta: CvMeta = { id, name: file.name.replace(/\.[^.]+$/, ''), type: file.type, size: file.size, uploadedAt: new Date().toISOString() }
        set((s) => ({ items: [meta, ...s.items], defaultId: s.defaultId ?? id }))
        return null
      },

      remove: async (id) => {
        await deleteFile(id).catch(() => undefined)
        set((s) => {
          const items = s.items.filter((x) => x.id !== id)
          return { items, defaultId: s.defaultId === id ? (items[0]?.id ?? null) : s.defaultId }
        })
      },

      rename: (id, name) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, name: name.trim() || x.name } : x)) })),
      setDefault: (id) => set({ defaultId: id }),
    }),
    { name: 'workmate-cv', version: 1, partialize: (s) => ({ items: s.items, defaultId: s.defaultId }) },
  ),
)
