import type { UserRole } from '@/types'

/**
 * DEMO-ONLY: danh sách tài khoản mẫu (đã có sẵn trong CSDL seed) cho các nút đăng nhập nhanh.
 * Đăng nhập vẫn đi qua backend thật (authService.login). Xóa file này khi bỏ nút đăng nhập nhanh.
 */
export interface DemoAccount {
  username: string
  password: string
  role: UserRole
  /** Nhãn hiển thị cho người dùng */
  label: string
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: 'admin1', password: '123456', role: 'jobseeker', label: 'Người tìm việc' },
  { username: 'admin2', password: '123456', role: 'recruiter', label: 'Nhà tuyển dụng' },
  { username: 'admin3', password: '123456', role: 'admin', label: 'Quản trị viên' },
]
