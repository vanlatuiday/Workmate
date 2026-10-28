import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { usePresence } from 'motion/react'
import { gsap, ScrollTrigger } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { haltSmoothScroll } from '@hooks/useSmoothScroll'
import { isCurtainActive } from '@components/motion/PageCurtain'

// Chuyển trang công khai nhẹ nhàng: trang cũ mờ đi thật nhanh, trang mới trượt từ trên
// xuống vào chỗ và hiện dần. Màn chuyển cảnh (PageCurtain) vẫn dùng cho mở chi tiết / Trang cá nhân.

/** Trang cũ mờ đi (giây) */
const EXIT = 0.2
/** Trang mới trượt xuống + hiện dần (giây) */
const ENTER = 0.55
/** Quãng trượt (px) — từ trên xuống */
const SLIDE = 32

/** Lần tải trang đầu tiên không có trang cũ — trang tự lo hiệu ứng mở đầu */
let firstPage = true
/** Trang mới mount trong một lượt chuyển trang (không phải lần tải đầu) */
let entering = false

/**
 * Trang mới gọi khi mount: trả về độ trễ (giây) để hiệu ứng vào (tiêu đề trồi lên…)
 * chạy cùng lúc trang trượt xuống; 0 nếu là lần tải đầu.
 */
export function usePageEnterDelay() {
  const [delay] = useState(() => (entering ? 0.15 : 0))
  return delay
}

/**
 * Khung của từng trang công khai — đặt làm con trực tiếp của
 * `<AnimatePresence mode="wait">`, `key` theo route.
 */
export default function PageTransition({ className, children }: { className?: string; children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence()
  const reduced = useReducedMotion()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const [first] = useState(firstPage)
  // safeToRemove có thể đổi giữa các lượt render — đọc qua ref để hiệu ứng ra chỉ chạy một lần
  const removeRef = useRef(safeToRemove)
  removeRef.current = safeToRemove
  const exiting = useRef(false)
  // Quyết định một lần lúc mount, ngay trong render (trước khi con render) để
  // usePageEnterDelay của trang đọc đúng; hiệu ứng vào xong thì tắt cờ
  const [animateIn] = useState(() => {
    const v = !first && !reduced && !isCurtainActive()
    entering = v
    return v
  })

  useEffect(() => {
    firstPage = false
  }, [])

  // Vào: trượt từ trên xuống + hiện dần. Trang chủ có intro riêng → chỉ hiện dần.
  // Màn chuyển cảnh đang che → không cần hiệu ứng (màn tự lộ trang).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !animateIn) return
    const home = pathname === '/'
    gsap.set(el, { opacity: 0, y: home ? 0 : -SLIDE })
    // Bắt đầu trượt sau hai khung hình: lúc mount, gỡ trang cũ + dựng trang mới (nhất là trang chủ)
    // làm trình duyệt đơ 0.2–0.3s; tween bắt đầu ngay sẽ nhảy cóc qua nửa quãng → giật.
    let tween: gsap.core.Tween | undefined
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        tween = gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: ENTER,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          onComplete: () => {
            entering = false
            // Trong lúc trượt, transform làm lệch phép đo của pin/scrub — đo lại khi đã vào chỗ
            ScrollTrigger.refresh()
          },
        })
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      tween?.kill()
      entering = false
    }
    // Chỉ chạy lúc mount
  }, [])

  // Ra: dừng cuộn mượt của trang cũ, mờ đi thật nhanh rồi gỡ (trang mới mount sau đó)
  useEffect(() => {
    const el = ref.current
    if (!el || isPresent || exiting.current) return
    exiting.current = true
    haltSmoothScroll()
    const done = () => removeRef.current?.()
    if (reduced || isCurtainActive()) done()
    else gsap.to(el, { opacity: 0, duration: EXIT, ease: 'power1.out', onComplete: done })
  }, [isPresent, reduced])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
