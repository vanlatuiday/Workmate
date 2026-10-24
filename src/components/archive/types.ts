import type { ReactNode } from 'react'
import type { Photo } from '@components/discover/types'

/**
 * Một "vật thể" trong không gian hồ sơ cá nhân: ảnh tượng trưng + nội dung mở ra khi bấm.
 * Mỗi vai trò tự dựng danh sách entry (nội dung, hành động riêng); cơ chế hiển thị dùng chung.
 */
export interface ArchiveEntry {
  id: string
  /** Số thứ tự hiển thị, vd. "01" */
  number: string
  title: string
  /** Một dòng gợi ý dưới ảnh — nói ảnh đại diện cho điều gì */
  caption: string
  photo: Photo
  /** Nhãn con trỏ khi rê lên ảnh */
  cursor: string
  /** Nội dung chi tiết khi mở */
  content: ReactNode
  /** Hành động cuối tấm hồ sơ (nút, link) */
  actions?: ReactNode
}
