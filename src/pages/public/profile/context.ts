// Trạng thái dùng chung cho cây component của trang cá nhân: chế độ xem, thông báo, theme.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { CompanyProfile, SeekerProfile } from './model'

export interface ViewState {
  /** true = chủ sở hữu đang sửa trang của mình */
  owner: boolean
  /** Hiện thông báo nhỏ (chỉ giả lập, chưa có backend) */
  notify: (message: string) => void
  /** Class theme của trang, để modal/toast (render ngoài cây) giữ đúng màu */
  themeClass: string
}

export const ViewCtx = createContext<ViewState>({ owner: false, notify: () => {}, themeClass: 'theme-ivory' })
export const useView = () => useContext(ViewCtx)

/** Thông báo tự tắt sau ~2.6 giây */
export function useToast() {
  const [message, setMessage] = useState('')
  const timer = useRef<number>()
  const notify = useCallback((m: string) => {
    window.clearTimeout(timer.current)
    // Đặt rỗng rồi đặt lại để vùng aria-live đọc lại cả khi nội dung trùng
    setMessage('')
    window.setTimeout(() => setMessage(m), 30)
    timer.current = window.setTimeout(() => setMessage(''), 2600)
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return { message, notify }
}

/** Một ô bento: phần tóm tắt (tầng 2) và phần chi tiết (tầng 3) */
export interface CellDef {
  id: string
  /** Vị trí "soi gương" trong lưới: A rộng, M = mức độ phù hợp, F = liên hệ */
  slot: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'M'
  label: string
  summary: React.ReactNode
  detail: React.ReactNode
  /** Form sửa dùng chung với ô khác (vd. ô Địa chỉ dùng form Liên hệ) */
  editId?: string
}

/** Mọi mảng dữ liệu cần để dựng hai loại hồ sơ */
export interface ProfileData {
  seeker: SeekerProfile
  company: CompanyProfile
}
