import type { User, UserRole } from '@/types'

/**
 * TẠM THỜI: tài khoản demo cố định để chạy giao diện khi chưa có backend.
 * Khi có backend, xóa file này và thay bằng authService (login/register thật).
 */
export interface DemoAccount {
  username: string
  password: string
  role: UserRole
  /** Nhãn hiển thị cho người dùng */
  label: string
  /** Trang chuyển tới sau khi đăng nhập */
  redirect: string
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: 'admin1', password: '123456', role: 'jobseeker', label: 'Người tìm việc', redirect: '/tim-viec' },
  { username: 'admin2', password: '123456', role: 'recruiter', label: 'Nhà tuyển dụng', redirect: '/tuyen-dung' },
  { username: 'admin3', password: '123456', role: 'admin', label: 'Quản trị viên', redirect: '/admin' },
]

/** Tìm tài khoản demo khớp tên đăng nhập + mật khẩu; không có thì trả về undefined. */
export function findDemoAccount(username: string, password: string): DemoAccount | undefined {
  const name = username.trim().toLowerCase()
  return DEMO_ACCOUNTS.find((a) => a.username === name && a.password === password)
}

/** Tài khoản demo ứng với một vai trò (dùng cho đăng ký demo). */
export function getDemoAccountByRole(role: Exclude<UserRole, 'admin'>): DemoAccount {
  return DEMO_ACCOUNTS.find((a) => a.role === role) ?? DEMO_ACCOUNTS[0]
}

/** Tạo object User cho authStore từ tài khoản demo (id cố định theo tên đăng nhập). */
export function buildDemoUser(account: DemoAccount): User {
  return {
    id: `demo-${account.username}`,
    email: `${account.username}@workmate.demo`,
    role: account.role,
    createdAt: new Date().toISOString(),
  }
}
