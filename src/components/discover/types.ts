/** Ảnh Unsplash: `id` là phần sau "photo-" trong URL. */
export type Photo = { id: string; alt: string }

/**
 * Ảnh minh họa từ Unsplash (Unsplash License — dùng miễn phí, kể cả thương mại).
 * Nạp thẳng từ CDN của Unsplash; đổi sang ảnh thật của doanh nghiệp khi có API.
 */
export function photoUrl(id: string, width: number) {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`
}

export function photoSrcSet(id: string) {
  return [640, 960, 1400].map((w) => `${photoUrl(id, w)} ${w}w`).join(', ')
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
}

/** Số thứ tự hai chữ số: 1 → "01" */
export { pad } from '@utils/format'
