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
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { username: 'admin1', password: '123456', role: 'jobseeker', label: 'Người tìm việc' },
  { username: 'admin2', password: '123456', role: 'recruiter', label: 'Nhà tuyển dụng' },
  { username: 'admin3', password: '123456', role: 'admin', label: 'Quản trị viên' },
]

/* Mật khẩu đã đổi/đặt lại: lưu localStorage dạng { tênĐăngNhập: mậtKhẩu }, đè lên mật khẩu mặc định. */
const PASSWORD_KEY = 'workmate-passwords'

function readOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORD_KEY)
    const data: unknown = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' ? (data as Record<string, string>) : {}
  } catch {
    return {}
  }
}

/** Mật khẩu đang có hiệu lực của tài khoản (bản đã đổi nếu có, không thì mặc định). */
export function getEffectivePassword(account: DemoAccount): string {
  return readOverrides()[account.username] ?? account.password
}

/** Đặt mật khẩu mới cho tài khoản demo (giữ qua lần tải lại trang). */
export function setDemoPassword(username: string, password: string) {
  try {
    localStorage.setItem(PASSWORD_KEY, JSON.stringify({ ...readOverrides(), [username]: password }))
  } catch {
    /* localStorage bị chặn: bỏ qua, mật khẩu quay về mặc định */
  }
}

/** Xóa mọi mật khẩu đã đổi (dùng khi đặt lại dữ liệu demo). */
export function clearPasswordOverrides() {
  try {
    localStorage.removeItem(PASSWORD_KEY)
  } catch {
    /* bỏ qua */
  }
}

/** Tìm tài khoản demo theo tên đăng nhập hoặc email `<tên>@workmate.demo`; không có thì undefined. */
export function findDemoAccountByIdentifier(identifier: string): DemoAccount | undefined {
  const id = identifier.trim().toLowerCase().replace(/@workmate\.demo$/, '')
  return DEMO_ACCOUNTS.find((a) => a.username === id)
}

/** Tìm tài khoản demo khớp tên đăng nhập + mật khẩu (có tính mật khẩu đã đổi); không có thì trả về undefined. */
export function findDemoAccount(username: string, password: string): DemoAccount | undefined {
  const name = username.trim().toLowerCase()
  return DEMO_ACCOUNTS.find((a) => a.username === name && getEffectivePassword(a) === password)
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
