import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'

/** Hướng màn: 'up' = trượt từ dưới lên (mở trang chi tiết), 'down' = phủ từ trên xuống (trang cá nhân, như menu) */
export type CurtainDirection = 'up' | 'down'

type Request = {
  id: number
  title: string
  direction: CurtainDirection
  onCovered: () => void
  to: string
  /** Trang đang đứng lúc bắt đầu — để biết hai trang có cùng màu nền không */
  from: string
}

/**
 * Màu tấm màn theo nền của trang đích: trang chủ và Trang cá nhân nền than chì,
 * các trang công khai khác nền ngà. Dùng chung cho mọi kiểu chuyển trang.
 */
export function curtainColors(to: string) {
  const path = to.split(/[?#]/)[0]
  return path === '/' || path === '/ca-nhan' ? 'bg-wm-charcoal text-wm-ivory' : 'bg-wm-ivory text-wm-charcoal'
}

/**
 * Đường kẻ đậm ở hai mép tấm màn — chỉ hiện khi trang đi và trang đến cùng màu nền
 * (màn cùng màu trang thì gần như không thấy mép). Màu kẻ ngược màu màn.
 * Đặt bên trong tấm màn (phần tử cha cần `relative`/`fixed`).
 */
export function CurtainEdges({ from, to }: { from: string; to: string }) {
  if (curtainColors(from) !== curtainColors(to)) return null
  const line = curtainColors(to).startsWith('bg-wm-charcoal') ? 'bg-wm-ivory' : 'bg-wm-charcoal'
  return (
    <>
      <span className={cn('absolute inset-x-0 top-0 h-[3px]', line)} />
      <span className={cn('absolute inset-x-0 bottom-0 h-[3px]', line)} />
    </>
  )
}

const useCurtain = create<{
  req: Request | null
  play: (title: string, direction: CurtainDirection, onCovered: () => void, to: string) => void
  finish: () => void
}>()((set) => ({
  req: null,
  play: (title, direction, onCovered, to) =>
    set((s) => ({ req: { id: (s.req?.id ?? 0) + 1, title, direction, onCovered, to, from: window.location.pathname } })),
  finish: () => set({ req: null }),
}))

/** Giữ màn sau khi đổi trang (giây) — đủ cho trang mới dựng xong phía sau màn */
const HOLD = 0.55
/** Từ lúc trang mới mount tới khi màn bắt đầu kéo lên — dưới màn, trang cũ được gỡ ngay
    (xem PageTransition) nên trang mới mount ngay lúc đổi route, ≈ HOLD */
const CURTAIN_REVEAL_DELAY = 0.55

/** Màn chuyển cảnh (mở chi tiết, Trang cá nhân) đang chạy? Khi đó PageTransition tự nhường. */
export function isCurtainActive() {
  return useCurtain.getState().req !== null
}

/** Trang đích gọi khi mount: đang có màn che → trả về độ trễ để hiệu ứng vào chạy đúng lúc màn mở. */
export function useCurtainDelay() {
  // Đọc một lần lúc mount, không cần theo dõi
  const [delay] = useState(() => (useCurtain.getState().req ? CURTAIN_REVEAL_DELAY : 0))
  return delay
}

/**
 * Điều hướng có màn chuyển cảnh: tấm màn (màu nền trang đích) trượt phủ màn hình, tên
 * nơi sắp tới hiện giữa, đổi trang phía sau, rồi tấm màn kéo tiếp lên để lộ trang mới.
 * "Giảm chuyển động" → điều hướng thẳng.
 */
export function useCurtainNavigate() {
  const navigate = useNavigate()
  const play = useCurtain((s) => s.play)
  const reduced = useReducedMotion()
  return (to: string, title: string, state?: unknown, direction: CurtainDirection = 'up') => {
    if (reduced) navigate(to, { state })
    else play(title, direction, () => navigate(to, { state }), to)
  }
}

/** Link đi qua màn chuyển cảnh. Ctrl/Cmd/Shift + bấm vẫn mở tab mới như link thường. */
export function CurtainLink({
  to,
  title,
  state,
  direction = 'up',
  className,
  children,
  ...rest
}: {
  to: string
  /** Chữ hiện giữa màn */
  title: string
  state?: unknown
  direction?: CurtainDirection
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  const go = useCurtainNavigate()
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    go(to, title, state, direction)
  }
  return (
    <Link to={to} state={state} onClick={onClick} className={className} {...rest}>
      {children}
    </Link>
  )
}

/** Tấm màn — đặt một lần trong PublicLayout. */
export default function PageCurtain() {
  const req = useCurtain((s) => s.req)
  const finish = useCurtain((s) => s.finish)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)

  useGSAP(
    () => {
      if (!req) return
      const panel = panelRef.current
      const title = titleRef.current
      // Màn đi một chiều: vào từ một mép, ra ở mép đối diện
      const from = req.direction === 'down' ? -100 : 100
      gsap
        .timeline({ onComplete: finish })
        .set(panel, { yPercent: from, visibility: 'visible' })
        .set(title, { yPercent: 60, opacity: 0 })
        .to(panel, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' })
        .to(title, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }, '-=0.15')
        // Màn đã phủ kín → đổi trang phía sau
        .call(req.onCovered)
        .to(title, { yPercent: -40, opacity: 0, duration: 0.3, ease: 'power2.in' }, `+=${HOLD - 0.3}`)
        .to(panel, { yPercent: -from, duration: 0.65, ease: 'power3.inOut' }, '-=0.05')
        .set(panel, { visibility: 'hidden' })
    },
    { dependencies: [req?.id] },
  )

  return (
    <div
      ref={panelRef}
      aria-hidden
      className={cn('invisible fixed inset-0 z-[90] grid place-items-center', curtainColors(req?.to ?? '/'))}
    >
      {req && <CurtainEdges from={req.from} to={req.to} />}
      {/* Màn kéo xuống (Trang cá nhân) không hiện chữ — kéo xong là thấy nội dung, như mọi lần đổi trang */}
      <p
        ref={titleRef}
        className="max-w-[18ch] px-6 text-center font-display text-display-sm font-semibold"
      >
        {req?.direction === 'up' ? req.title : ''}
      </p>
    </div>
  )
}
