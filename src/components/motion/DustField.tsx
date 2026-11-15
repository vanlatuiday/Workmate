import { useEffect, useRef } from 'react'
import { cn } from '@utils/cn'
import { useReducedMotion } from '@hooks/useReducedMotion'
import tokens from '@/styles/tokens.json'

/**
 * Lớp "bụi" cho nền tối (DESIGN.md → Hai nền): hạt 1–2px, độ đục 0,2–0,6, trôi rất chậm.
 * Nhẹ hơn ParticleField của trang chủ (không WebGL, không logo, không theo cuộn) nên dùng được ở
 * trang đăng nhập, form bắt đầu, dải đầu trang con. `density="low"` = thưa hơn, cho dải đầu trang.
 * `motion="gentle"` = trôi rõ hơn một chút + đung đưa ngang + lấp lánh (trang đăng nhập / đăng ký, chủ dự án yêu cầu);
 * mặc định `"still"` gần như đứng yên để không giành chú ý với tiêu đề.
 *
 * Canvas 2D, ≤ 30 khung/giây, tạm dừng khi tab bị ẩn hoặc khối ra khỏi màn hình.
 * Giảm chuyển động → vẽ một khung tĩnh, không chạy vòng lặp.
 */

const DENSITY = { normal: 1 / 9000, low: 1 / 26000 } as const
/** Tốc độ (px/giây), biên độ đung đưa ngang (px) và độ lấp lánh theo kiểu chuyển động */
const MOTION = {
  still: { vx: 6, vyMin: 1, vyMax: 6, sway: 0, twinkle: 0.08 },
  gentle: { vx: 14, vyMin: 5, vyMax: 16, sway: 10, twinkle: 0.18 },
} as const
const MAX_COUNT = 260
const FRAME_MS = 1000 / 30
/** Màu hạt: ngà ấm (không trắng tuyệt đối) */
const [R, G, B] = [1, 3, 5].map((i) => parseInt(tokens.palette.ivory.slice(i, i + 2), 16))

interface Dust {
  x: number
  y: number
  r: number
  a: number
  vx: number
  vy: number
  phase: number
}

export default function DustField({ density = 'normal', motion = 'still', className }: {
  density?: keyof typeof DENSITY
  motion?: keyof typeof MOTION
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let dust: Dust[] = []
    let raf = 0
    let last = 0
    let visible = true
    const m = MOTION[motion]

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const n = Math.min(MAX_COUNT, Math.round(w * h * DENSITY[density]))
      dust = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 0.5, // bán kính 0,5–1px → hạt 1–2px
        a: 0.2 + Math.random() * 0.4, // 0,2–0,6
        vx: (Math.random() - 0.5) * m.vx,
        vy: -m.vyMin - Math.random() * (m.vyMax - m.vyMin),
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t: number, dt: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      for (const d of dust) {
        d.x += d.vx * dt
        d.y += d.vy * dt
        if (d.y < -2) d.y = h + 2
        if (d.x < -2) d.x = w + 2
        else if (d.x > w + 2) d.x = -2
        // sáng tối nhẹ, không vượt khoảng 0,2–0,6
        const a = Math.min(0.6, Math.max(0.2, d.a + Math.sin(t / 2400 + d.phase) * m.twinkle))
        // đung đưa ngang như bụi trong nắng (chu kỳ ~6–9 giây, lệch pha từng hạt)
        const sx = m.sway ? Math.sin(t / (6000 + d.phase * 500) + d.phase) * m.sway : 0
        ctx.fillStyle = `rgba(${R},${G},${B},${a})`
        ctx.beginPath()
        ctx.arc(d.x + sx, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (t - last < FRAME_MS) return
      const dt = Math.min((t - last) / 1000, 0.1)
      last = t
      draw(t, dt)
    }
    const start = () => {
      if (reduced || raf || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    build()
    draw(0, 0)
    start()

    const ro = new ResizeObserver(() => {
      build()
      draw(0, 0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [density, motion, reduced])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} />
}
