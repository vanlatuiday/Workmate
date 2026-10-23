import type { UserRole } from '@/types'

/** Khu làm việc của từng vai trò: trang mở đầu + tên hiển thị trên header/menu. */
export const ROLE_AREAS: Record<UserRole, { home: string; label: string; roleLabel: string }> = {
  jobseeker: { home: '/tim-viec', label: 'Khu tìm việc', roleLabel: 'người tìm việc' },
  recruiter: { home: '/tuyen-dung', label: 'Khu tuyển dụng', roleLabel: 'nhà tuyển dụng' },
  admin: { home: '/admin', label: 'Khu quản trị', roleLabel: 'quản trị viên' },
}

/** Vai trò sở hữu đường dẫn này (khu làm việc), hoặc null nếu là trang công khai. */
export function roleOfPath(path: string): UserRole | null {
  const entry = (Object.entries(ROLE_AREAS) as [UserRole, { home: string }][]).find(
    ([, a]) => path === a.home || path.startsWith(a.home + '/'),
  )
  return entry ? entry[0] : null
}

/** Vai trò này có được vào đường dẫn không (trang công khai hoặc khu của chính mình). */
export function canVisit(role: UserRole, path: string) {
  const owner = roleOfPath(path)
  return owner === null || owner === role
}
