// Khóa cuộn trang dùng chung cho các khung nổi (tin nhắn, thông báo), có bộ đếm.
// Nhiều khung có thể khóa chồng nhau: chỉ lần khóa đầu mới lưu overflow gốc, chỉ lần mở cuối mới khôi phục.
import { getSmoothScroll } from '@hooks/useSmoothScroll'

let count = 0
let savedOverflow = ''
let savedLenis: ReturnType<typeof getSmoothScroll> = null

/** Khóa cuộn; trả về hàm mở khóa (gọi nhiều lần vẫn chỉ tính một lần). */
export function lockScroll(): () => void {
  const html = document.documentElement
  if (count === 0) {
    savedOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    // Trang công khai cuộn bằng Lenis: overflow hidden không chặn được → dừng Lenis luôn
    savedLenis = getSmoothScroll()
    savedLenis?.stop()
  }
  count++
  let released = false
  return () => {
    if (released) return
    released = true
    count = Math.max(0, count - 1)
    if (count === 0) {
      html.style.overflow = savedOverflow
      savedLenis?.start()
      savedLenis = null
    }
  }
}
