import { FOCUS } from './focus'

/**
 * Bộ nút và chip dùng chung cho cả site (DESIGN.md → Components). Không tự định nghĩa nút trong trang:
 * ghép `BTN_*` (kiểu) với `BTN_SM` / `BTN_LG` (cỡ, tùy chọn) bằng `cn(...)`.
 *
 * Quy tắc màu: mỗi màn hình tối đa MỘT nút `BTN_ACCENT` (hành động chính: Ứng tuyển, Đăng tin, Lưu, Gửi…).
 * Các hành động còn lại dùng `BTN_PRIMARY` (đen) hoặc `BTN_SECONDARY` (viền).
 */

/** Chuyển động chuẩn của phần tử bấm được: đổi màu 150ms, lún nhẹ khi bấm, tắt khi giảm chuyển động */
export const PRESS =
  'transition-[color,background-color,border-color,opacity,transform,filter] duration-fast ease-editorial active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100'

const BASE = `inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-medium ${PRESS} disabled:cursor-default disabled:opacity-50 disabled:active:scale-100 ${FOCUS}`

/** Hành động chính của màn hình — màu nhấn theo vai trò */
export const BTN_ACCENT = `${BASE} border-accent bg-accent text-accent-fg hover:brightness-110 disabled:hover:brightness-100`
/** Nút đặc màu chữ trang (đen trên nền sáng) — hành động quan trọng thứ hai, hoặc khi màn hình đã có nút nhấn */
export const BTN_PRIMARY = `${BASE} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg disabled:hover:bg-page-fg disabled:hover:text-page-bg`
/** Nút viền — hành động phụ */
export const BTN_SECONDARY = `${BASE} border-page-line text-page-fg hover:border-page-fg disabled:hover:border-page-line`
/** Nút chữ — hành động nhẹ (Hủy, Xem thêm) */
export const BTN_GHOST = `${BASE} border-transparent text-page-fg underline-offset-4 hover:underline`
/** Xóa, từ chối, rút lại */
export const BTN_DANGER = `${BASE} border-danger text-danger hover:bg-danger-soft`

/** Cỡ nhỏ (trong thẻ, hàng bảng) và cỡ lớn (CTA đầu trang). Đặt SAU kiểu nút trong cn() */
export const BTN_SM = 'min-h-9 px-4 py-2'
export const BTN_LG = 'px-8 py-4'

/** Nút chỉ có icon, hình tròn 40px. Luôn kèm aria-label */
export const BTN_ICON = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-page-line text-page-fg hover:border-page-fg ${PRESS} ${FOCUS}`

/** Chip lọc / tab dạng viên: `CHIP` + `CHIP_ON` hoặc `CHIP_OFF` theo trạng thái (kèm aria-pressed / aria-selected) */
export const CHIP = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm ${PRESS} ${FOCUS}`
export const CHIP_ON = 'border-accent bg-accent font-medium text-accent-fg'
export const CHIP_OFF = 'border-page-line text-page-fg hover:border-page-fg'

/** Link chữ màu nhấn trên nền sáng */
export const LINK = `rounded-control text-accent-ink underline-offset-4 hover:underline ${FOCUS}`

/** Thẻ bấm được: viền đậm lên + nhấc 2px khi hover */
export const CARD_HOVER =
  'transition-[border-color,transform] duration-base ease-editorial hover:-translate-y-0.5 hover:border-page-fg motion-reduce:transition-none motion-reduce:hover:translate-y-0'
