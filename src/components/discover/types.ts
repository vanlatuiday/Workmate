/** Ảnh tải lên dùng `url`; ảnh mẫu Unsplash dùng `id` sau "photo-". */
export type Photo = { id?: string; url?: string; alt: string }

function directPhotoUrl(value: string | undefined) {
  const url = value?.trim()
  if (!url || url.includes('\\') || [...url].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return undefined
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).hostname ? url : undefined
    } catch {
      return undefined
    }
  }
  return /^(?:\/(?!\/)|\.{1,2}\/|[\w-]+\/)/.test(url) && !url.includes(':') ? url : undefined
}

/**
 * Giữ nguyên URL ảnh doanh nghiệp; ảnh mẫu nạp từ CDN Unsplash.
 */
export function photoUrl(photo: Photo | string | undefined, width: number) {
  const url = directPhotoUrl(typeof photo === 'string' ? photo : photo?.url)
  if (url) return url
  const id = typeof photo === 'string' ? photo : photo?.id
  return id && /^[\w-]+$/.test(id)
    ? `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`
    : undefined
}

export function photoSrcSet(photo: Photo | string | undefined) {
  if (directPhotoUrl(typeof photo === 'string' ? photo : photo?.url) || !photoUrl(photo, 640)) return undefined
  return [640, 960, 1400].map((w) => `${photoUrl(photo, w)} ${w}w`).join(', ')
}

/** Một mục trong bộ sưu tập ảnh ở /viec-lam. Nội dung chữ do từng vai trò tự vẽ. */
export interface GalleryItem {
  id: string
  title: string
  href: string
  photo: Photo
  /** Nhãn ngắn hiện trong con trỏ khi rê lên ảnh, vd. "Xem" */
  cursor: string
  /** Tên đầy đủ của liên kết cho trình đọc màn hình */
  linkLabel: string
  /** true: `href` là tin chi tiết dạng popup trên cùng trang (?tin=…) → mở bằng điều hướng thường, không qua màn che chuyển trang */
  popup?: boolean
}

/** Số thứ tự hai chữ số: 1 → "01" */
export { pad } from '@utils/format'
