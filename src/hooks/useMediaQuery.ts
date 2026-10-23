import { useEffect, useState } from 'react'

/**
 * Theo dõi một media query. Đọc giá trị ngay ở lần render đầu
 * để không bị nháy giữa hai bố cục khác nhau.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Chuột thật (không phải màn hình cảm ứng) và người dùng không tắt chuyển động.
 * Các hiệu ứng bám theo con trỏ chỉ bật khi query này đúng.
 */
export const FINE_POINTER = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
