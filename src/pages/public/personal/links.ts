// Đường dẫn trang Cá nhân. Chủ trang xem /ca-nhan theo vai trò đang đăng nhập.
export const PERSONAL_HREF = '/ca-nhan'
/** Hồ sơ thật của một ứng viên, nhà tuyển dụng xem */
export const candidateHref = (seekerId: string) => `/ung-vien/${encodeURIComponent(seekerId)}`
