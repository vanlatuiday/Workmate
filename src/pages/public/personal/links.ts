// Đường dẫn trang Cá nhân. Chủ trang xem /ca-nhan theo vai trò đang đăng nhập;
// thẻ ở trang Việc làm mở bản công khai (chỉ xem) của bên kia bằng ?xem=…
export const PERSONAL_HREF = '/ca-nhan'
/** Trang doanh nghiệp mẫu, chế độ người xem */
export const COMPANY_PUBLIC_HREF = '/ca-nhan?xem=doanh-nghiep'
/** Hồ sơ ứng viên mẫu, chế độ người xem (ẩn thông tin nhạy cảm) */
export const SEEKER_PUBLIC_HREF = '/ca-nhan?xem=ung-vien'
