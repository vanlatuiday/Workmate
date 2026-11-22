import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { gsap, useGSAP } from '@utils/gsap'
import { cn } from '@utils/cn'
import { isDayPath } from '@components/layout/dayContext'

/** Hướng màn: 'up' = trượt từ dưới lên (mở trang chi tiết), 'down' = phủ từ trên xuống (trang cá nhân, như menu) */
type CurtainDirection = 'up' | 'down'

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
 * Màu tấm màn theo nền của trang đích (cập nhật 2026-11-22 theo nền mới):
 * trang chủ → xanh abyss; trang ban ngày (Việc làm, Công ty, Kết nối…) → nền day + bầu trời xanh nhạt (.curtain-day);
 * /ca-nhan, /ho-so → than chì như cũ; trang công khai còn lại → ngà.
 */
function curtainColors(to: string) {
  const path = to.split(/[?#]/)[0]
  if (path === '/') return 'bg-wm-abyss text-wm-ivory'
  if (path === '/ca-nhan' || path === '/ho-so') return 'bg-wm-charcoal text-wm-ivory'
  if (isDayPath(path)) return 'curtain-day text-wm-abyss'
  return 'bg-wm-ivory text-wm-charcoal'
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
const HOLD = 0.3
/** Từ lúc trang mới mount tới khi màn bắt đầu kéo lên — dưới màn, trang cũ được gỡ ngay
    (xem PageTransition) nên trang mới mount ngay lúc đổi route, ≈ HOLD */
const CURTAIN_REVEAL_DELAY = 0.35

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
  // Chủ dự án 2026-11-22: bỏ tấm màn + chữ giữa màn — đổi trang thẳng, PageTransition lo phần mờ/hiện
  // cho mượt và nhanh. Giữ chữ ký hàm (title, direction) để nơi gọi không phải đổi.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (to: string, _title?: string, state?: unknown, _direction?: CurtainDirection) => {
    navigate(to, { state })
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
        .to(panel, { yPercent: 0, duration: 0.42, ease: 'power3.inOut' })
        .to(title, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, '-=0.2')
        // Màn đã phủ kín → đổi trang phía sau
        .call(req.onCovered)
        .to(title, { yPercent: -30, opacity: 0, duration: 0.22, ease: 'power2.in' }, `+=${HOLD - 0.2}`)
        .to(panel, { yPercent: -from, duration: 0.5, ease: 'power3.inOut' }, '-=0.05')
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
      {/* Màn kéo xuống (Trang cá nhân) không hiện chữ — kéo xong là thấy nội dung, như mọi lần đổi trang */}
      <p
        ref={titleRef}
        className="max-w-[22ch] px-6 text-center font-display text-3xl font-semibold md:text-4xl"
      >
        {req?.direction === 'up' ? req.title : ''}
      </p>
    </div>
  )
}
