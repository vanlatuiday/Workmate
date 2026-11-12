import toast from 'react-hot-toast'

/**
 * Phản hồi sau thao tác, dùng chung cả site (DESIGN.md → Motion "phản hồi thành công").
 * Chỉ báo cho hành động người dùng chủ động làm (lưu tin, ứng tuyển, kết nối, gửi…), một câu ngắn tiếng Việt,
 * không báo cho thao tác tự lưu. Nút/icon tại chỗ cũng đổi trạng thái (kèm `POP` cho icon) để người dùng thấy ngay.
 */
export function notifySuccess(message: string) {
  // Bấm liên tiếp (lưu rồi bỏ lưu): thay thông báo cũ thay vì xếp chồng
  if (lastSuccess && lastSuccess !== message) toast.dismiss(lastSuccess)
  lastSuccess = message
  toast.success(message, { id: message })
}
let lastSuccess: string | null = null

export function notifyError(message: string) {
  toast.error(message, { id: message })
}

/** Icon vừa đổi trạng thái (tim, dấu lưu, dấu tích): nảy nhẹ một lần. Gắn khi trạng thái bật, kèm key để chạy lại */
export const POP = 'animate-pop motion-reduce:animate-none'

// Mốc người dùng vừa bấm / gõ phím: phân biệt "người dùng vừa bật" với "dữ liệu tải về làm trạng thái đổi"
let lastGesture = 0
if (typeof document !== 'undefined') {
  const mark = () => { lastGesture = Date.now() }
  document.addEventListener('pointerdown', mark, { capture: true, passive: true })
  document.addEventListener('keydown', mark, { capture: true, passive: true })
}

/**
 * Người dùng vừa bấm / gõ phím trong ~1,5 giây qua, và lần đó xảy ra SAU mốc `since` (vd. lúc icon xuất hiện) —
 * để chỉ nảy icon khi chính họ bấm trên trang này, không phải cú bấm mở trang rồi dữ liệu tải về.
 */
export const recentlyInteracted = (since = 0, ms = 1500) => lastGesture > since && Date.now() - lastGesture < ms
