import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@utils/gsap'

/** Instance đang chạy — để các section cuộn tới vị trí cụ thể mà không giật. */
let current: Lenis | null = null

/** Cuộn tới vị trí `y`, đi qua Lenis nếu đang bật. Mặc định tức thì; `smooth` để trôi tới. */
export function scrollToY(y: number, smooth = false) {
  if (current) current.scrollTo(y, smooth ? { duration: 1 } : { immediate: true })
  else window.scrollTo(0, y)
}

/**
 * Smooth scroll cho toàn trang. Tự tắt khi người dùng bật
 * "giảm chuyển động" trong cài đặt hệ điều hành.
 *
 * Lenis chạy trên ticker của GSAP để ScrollTrigger (pin, scrub)
 * đọc cùng một vị trí cuộn với Lenis trong mỗi khung hình.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })
    current = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      current = null
    }
  }, [])
}
