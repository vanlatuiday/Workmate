import { useMediaQuery } from './useMediaQuery'

/**
 * Theo dõi cài đặt "giảm chuyển động" của hệ điều hành.
 * useMediaQuery đọc ngay ở lần render đầu: nếu chờ tới useEffect, người bật
 * "giảm chuyển động" sẽ thấy intro trang chủ lóe lên một khung hình trước khi bị tắt.
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
