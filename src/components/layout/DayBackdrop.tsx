import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import bgUrl from '@assets/images/page-bg-day.webp'
import jobsBgUrl from '@assets/images/page-bg-jobs-preview.webp'

/** Mỗi đầu trang mở/khép trong 1,6 chiều cao màn hình */
const SPAN_VH = 1.6
/** Khi khép, còn lại ~15% độ mở */
const CLOSE_KEEP = 0.15

/** easeOutCubic */
const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Nền ban ngày cố định cho trang công khai (DESIGN.md → Nền ban ngày, 2026-11-21): một lớp ảnh nhòe
 * (ảnh đã làm nhòe + giảm bão hòa sẵn trong file — không dùng CSS filter để khỏi vẽ lại nhòe mỗi khung hình khi phóng; độ đục 0.6 trên nền day, tràn ra 60px) + lớp "sương" trắng ở giữa cho chữ dễ đọc.
 * Nhịp cuộn: mở trong 1,6 màn đầu (ảnh scale 1→1.12 × 1→1.38, sương scaleX 1→1.35), giữ, rồi khép về ~15% ở 1,6 màn cuối.
 * Chỉ transform; ScrollTrigger đọc vị trí cuộn (cùng nguồn với Lenis nếu trang đang bật) và quickTo làm mượt ~0,6s.
 * Chiều cao trang đổi (ảnh tải xong, đổi route) → ResizeObserver tính lại độ mở. Giảm chuyển động → tĩnh.
 * Bản thử Việc làm chỉ dịch ảnh dọc ±24px (mobile ±12px), không phóng ảnh hoặc chạy lớp sương.
 */
export default function DayBackdrop({ jobsPreview = false }: { jobsPreview?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const backgroundUrl = jobsPreview ? jobsBgUrl : bgUrl

  // Đánh dấu <html data-day> khi đang ở trang ban ngày: nút nổi (tin nhắn, thông báo) nằm ngoài <main> đổi sang abyss
  useEffect(() => {
    document.documentElement.dataset.day = ''
    return () => {
      delete document.documentElement.dataset.day
    }
  }, [])

  // Tải sớm ảnh nền (Vite đã băm tên file nên dùng đường dẫn đã import)
  useEffect(() => {
    if (document.head.querySelector(`link[rel="preload"][href="${backgroundUrl}"]`)) return
    const l = document.createElement('link')
    l.rel = 'preload'
    l.as = 'image'
    l.href = backgroundUrl
    document.head.appendChild(l)
  }, [backgroundUrl])

  useGSAP(
    () => {
      if (reduced || !img.current || !veil.current) return
      if (jobsPreview) {
        // Chỉ dịch một lớp ảnh; biên độ nhỏ và phần tràn giữ mép nền luôn kín.
        const distance = () => window.innerWidth < 768 ? 12 : 24
        const drift = gsap.fromTo(img.current, { y: distance }, {
          y: () => -distance(), ease: 'none', force3D: true,
          scrollTrigger: { start: 0, end: 'max', scrub: 0.35, invalidateOnRefresh: true },
        })
        let raf = 0
        const ro = new ResizeObserver(() => {
          cancelAnimationFrame(raf)
          raf = requestAnimationFrame(() => drift.scrollTrigger?.refresh())
        })
        ro.observe(document.body)
        return () => {
          cancelAnimationFrame(raf)
          ro.disconnect()
        }
      }
      const opts = { duration: 0.6, ease: 'power3.out' }
      const sx = gsap.quickTo(img.current, 'scaleX', opts)
      const sy = gsap.quickTo(img.current, 'scaleY', opts)
      const vx = gsap.quickTo(veil.current, 'scaleX', opts)

      const apply = () => {
        const vh = window.innerHeight
        const span = vh * SPAN_VH
        const max = Math.max(1, ScrollTrigger.maxScroll(window))
        const y = window.scrollY
        const open = ease(Math.min(1, y / span))
        const close = ease(Math.min(1, Math.max(0, (y - (max - span)) / span)))
        const e = open * (1 - close * (1 - CLOSE_KEEP))
        sx(1 + e * 0.12)
        sy(1 + e * 0.38)
        vx(1 + e * 0.35)
      }
      // start/end số: không cần phần tử kích hoạt; end 'max' = cuối trang, luôn đúng khi trang đổi chiều cao
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: apply, onRefresh: apply })
      apply()

      // Chiều cao trang đổi (ảnh/nội dung tải xong, đổi route): tính lại độ mở, gộp theo khung hình
      let raf = 0
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(apply)
      })
      ro.observe(document.body)
      return () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
      }
    },
    { scope: root, dependencies: [reduced, jobsPreview], revertOnUpdate: true },
  )

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-wm-day" data-jobs-background={jobsPreview || undefined}>
      <div
        ref={img}
        className={jobsPreview ? 'jobs-day-image absolute inset-0' : 'absolute -inset-[60px] origin-center will-change-transform'}
        style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: jobsPreview ? 'cover' : '100% 100%',
          backgroundPosition: jobsPreview ? undefined : 'center',
          backgroundRepeat: 'no-repeat',
          opacity: jobsPreview ? 1 : 0.6,
        }}
      />
      <div
        ref={veil}
        className={jobsPreview ? 'absolute inset-0' : 'absolute inset-0 origin-center will-change-transform'}
        style={{
          background:
            jobsPreview
              ? 'radial-gradient(ellipse 70% 85% at 42% 45%, color-mix(in srgb, var(--wm-day) 24%, transparent), transparent 85%)'
              : 'radial-gradient(ellipse 52% 64% at 50% 52%, color-mix(in srgb, var(--wm-day) 70%, transparent), color-mix(in srgb, var(--wm-day) 0%, transparent) 82%)',
        }}
      />
      {/* Nối với trang chủ (chủ dự án 2026-11-21, mức B): mép trên/dưới + góc ngả azure nhẹ, cột sáng xanh ngọc mờ
          ở giữa và sao xanh rất mờ — đứng yên, giữa trang vẫn sáng để đọc chữ (index.css → .day-sky) */}
      {!jobsPreview && <div className="day-sky absolute inset-0" />}
      {!jobsPreview && <div className="day-sky-stars absolute inset-0" />}
    </div>
  )
}
