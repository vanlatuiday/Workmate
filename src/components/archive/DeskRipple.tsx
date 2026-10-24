import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { gsap } from '@utils/gsap'

/** 'out' = lan từ tâm ra ngoài; 'in' = từ mép màn hình co vào, hội tụ tại tâm */
export type RippleDirection = 'out' | 'in'

export type DeskRippleHandle = {
  /** Phát một vòng sóng quanh điểm (x, y) theo toạ độ màn hình; `duration` (giây) mặc định DURATION */
  play: (x: number, y: number, direction?: RippleDirection, duration?: number) => void
}

/** Số hạt trên vòng, độ dày vòng (px), thời gian lan (giây) */
const PARTICLES = 2800
const THICKNESS = 90
const DURATION = 1.9

type Particle = { angle: number; offset: number; size: number; alpha: number }

/** Lệch ngẫu nhiên dồn về giữa vòng (gần phân phối chuẩn) — mép vòng lấm tấm, không sắc */
const jitter = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLES }, () => ({
    angle: Math.random() * Math.PI * 2,
    offset: jitter() * (THICKNESS / 2),
    size: Math.random() < 0.7 ? 1.5 : 2.5,
    alpha: 0.45 + Math.random() * 0.55,
  }))
}

/**
 * Vòng sóng hạt bụi lan trên mặt bàn khi một tấm ảnh được đặt lại (đóng tờ hồ sơ).
 * Canvas cố định, nằm dưới các tấm ảnh (-z-10 trong lớp `isolate` của trang), không nhận chuột.
 * Mỗi lần phát vẽ lại theo GSAP ticker rồi dừng hẳn — không vòng lặp khi đứng yên.
 */
const DeskRipple = forwardRef<DeskRippleHandle>(function DeskRipple(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  // Context riêng: play() có thể được gọi từ callback timeline của component khác —
  // tween tạo ra phải thuộc về đây, không bị huỷ khi component kia gỡ khỏi cây
  const ctxRef = useRef<gsap.Context | null>(null)
  useEffect(() => {
    ctxRef.current = gsap.context(() => {})
    return () => ctxRef.current?.revert()
  }, [])

  useImperativeHandle(ref, () => ({
    play(x, y, direction = 'out', duration = DURATION) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Màu hạt = ngà của bảng màu (đọc từ biến CSS, không ghi hex)
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--wm-ivory').trim() || 'white'

      // Lan tới góc xa nhất để vòng đi hết màn hình
      const maxR = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))
      const particles = makeParticles()
      // Co vào là bản đảo ngược của lan ra: bắt đầu ở mép (mờ), về tới tâm (rõ nhất) thì tắt
      const inward = direction === 'in'
      const state = { r: inward ? maxR : 0, fade: inward ? 0 : 1 }

      const draw = () => {
        ctx.clearRect(0, 0, w, h)
        for (const p of particles) {
          const rr = state.r + p.offset
          if (rr <= 0) continue
          ctx.globalAlpha = p.alpha * state.fade
          ctx.fillRect(x + Math.cos(p.angle) * rr, y + Math.sin(p.angle) * rr, p.size, p.size)
        }
      }

      tweenRef.current?.kill()
      ctxRef.current?.add(() => {
        tweenRef.current = gsap.to(state, {
          r: inward ? 0 : maxR,
          duration,
          ease: inward ? 'power2.in' : 'power2.out',
          onUpdate: () => {
            // Càng xa tâm càng mờ — lan ra thì tan dần, co vào thì rõ dần
            state.fade = 1 - Math.pow(state.r / maxR, 2.2)
            draw()
          },
          onComplete: () => ctx.clearRect(0, 0, w, h),
        })
      })
    },
  }))

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
})

export default DeskRipple
