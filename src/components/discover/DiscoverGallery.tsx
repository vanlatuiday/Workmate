import type { ReactNode } from 'react'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useReducedMotion } from '@hooks/useReducedMotion'
import ScrollGallery from './ScrollGallery'
import StaticGallery from './StaticGallery'
import type { GalleryItem } from './types'

export type GalleryProps<T extends GalleryItem> = {
  items: T[]
  /** Tên vùng cho trình đọc màn hình */
  label: string
  /** Phần mở đầu (có h1) — cột trái trên desktop, phía trên danh sách ở bản xếp dọc */
  intro: ReactNode
  /** Nội dung chữ đi kèm một mục; mỗi vai trò tự vẽ (nên có h2 là tên mục) */
  renderDetail: (item: T) => ReactNode
}

/**
 * Bộ sưu tập ảnh dùng chung cho /viec-lam. Desktop có chuột → ảnh chạy theo cuộn;
 * màn hình nhỏ hoặc "giảm chuyển động" → danh sách xếp dọc, cùng nội dung.
 */
export default function DiscoverGallery<T extends GalleryItem>(props: GalleryProps<T>) {
  const wide = useMediaQuery('(min-width: 1024px)')
  const reduced = useReducedMotion()
  return wide && !reduced ? <ScrollGallery {...props} /> : <StaticGallery {...props} />
}
