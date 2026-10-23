import { useEffect, useState } from 'react'

/** Theo dõi cài đặt "giảm chuyển động" của hệ điều hành. */
export function useReducedMotion() {
  // Đọc ngay ở lần render đầu: nếu chờ tới useEffect, người bật "giảm chuyển động"
  // sẽ thấy intro trang chủ lóe lên một khung hình trước khi bị tắt.
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
