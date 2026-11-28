import type { UserRole } from '@/types'

export type MenuItem = { label: string; href: string }

/** Mục điều hướng theo người đang xem. Khách thấy lời mời trung lập cho cả hai phía;
    đã đăng nhập thì chỉ thấy lối tắt tới việc của vai trò mình. */
export const NAV: Record<UserRole | 'guest', MenuItem[]> = {
  guest: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Nhà tuyển dụng', href: '/nha-tuyen-dung' },
    { label: 'Kết nối', href: '/match' },
  ],
  jobseeker: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Hồ sơ', href: '/ho-so' },
    { label: 'Kết nối', href: '/match' },
  ],
  // Tối đa 3 mục để header gọn; các trang khác của nhà tuyển dụng nằm trong khu tuyển dụng
  recruiter: [
    { label: 'Việc làm', href: '/viec-lam' },
    { label: 'Kết nối', href: '/match' },
    { label: 'Đăng tin', href: '/dang-tin' },
  ],
  admin: [
    { label: 'Xác minh', href: '/admin/xac-minh' },
    { label: 'Người dùng', href: '/admin/nguoi-dung' },
  ],
}
