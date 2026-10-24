import { forwardRef, useRef, type PointerEvent } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import type { ArchiveEntry } from './types'

type Props = {
  entry: ArchiveEntry
  /** Độ nghiêng tĩnh (độ) — như tấm ảnh đặt trên bàn */
  tilt: number
  /** Tỉ lệ khung ảnh, class Tailwind, vd. "aspect-[4/5]" */
  aspect: string
  /** Đang mở → ẩn tại chỗ (bản sao của nó nằm trên lớp phủ) */
  lifted: boolean
  /** Cho kéo thả trên mặt bàn (desktop có chuột) */
  draggable: boolean
  /** Bắt đầu kéo → đưa tấm ảnh lên trên cùng */
  onLift: () => void
  onOpen: () => void
}

/** Kéo quá ngưỡng này (px) mới tính là kéo, dưới ngưỡng là bấm */
const DRAG_THRESHOLD = 6

/**
 * Một tấm ảnh in trên mặt bàn. Ba lớp transform tách riêng để không ghi đè nhau:
 *   `dragRef`   — vị trí do người dùng kéo thả
 *   `magnetRef` — bị "hút" nhẹ theo con trỏ khi rê
 *   figure      — độ nghiêng tĩnh
 * Bấm (không kéo) / Enter / Space → mở tờ hồ sơ.
 */
const ArchiveItem = forwardRef<HTMLButtonElement, Props>(function ArchiveItem(
  { entry, tilt, aspect, lifted, draggable, onLift, onOpen },
  ref,
) {
  const dragRef = useRef<HTMLDivElement>(null)
  const magnetRef = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery(FINE_POINTER)
  const drag = useRef({ active: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 })
  const { contextSafe } = useGSAP({ scope: dragRef })

  const onDown = contextSafe((e: PointerEvent<HTMLButtonElement>) => {
    if (!draggable || e.button !== 0) return
    const d = drag.current
    d.active = true
    d.moved = false
    d.sx = e.clientX
    d.sy = e.clientY
    d.ox = Number(gsap.getProperty(dragRef.current, 'x'))
    d.oy = Number(gsap.getProperty(dragRef.current, 'y'))
    try {
      // Giữ sự kiện khi con trỏ chạy nhanh ra ngoài tấm ảnh
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* con trỏ không còn hoạt động — bỏ qua */
    }
  })

  const onMove = contextSafe((e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (d.active) {
      const dx = e.clientX - d.sx
      const dy = e.clientY - d.sy
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      if (!d.moved) {
        d.moved = true
        onLift()
        gsap.to(magnetRef.current, { x: 0, y: 0, rotation: 0, scale: 1.05, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
      }
      gsap.to(dragRef.current, { x: d.ox + dx, y: d.oy + dy, duration: 0.25, ease: 'power3.out', overwrite: 'auto' })
      return
    }
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const mx = (e.clientX - (r.left + r.width / 2)) / r.width
    const my = (e.clientY - (r.top + r.height / 2)) / r.height
    gsap.to(magnetRef.current, { x: mx * 16, y: my * 16, rotation: mx * 1.5, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
  })

  const onUp = contextSafe(() => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.moved) gsap.to(magnetRef.current, { scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: 'auto' })
  })

  const onLeave = contextSafe(() => {
    if (drag.current.active) return
    gsap.to(magnetRef.current, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)', overwrite: 'auto' })
  })

  return (
    <div ref={dragRef} data-drag className="will-change-transform">
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          // Vừa kéo xong → không mở
          if (drag.current.moved) {
            drag.current.moved = false
            e.preventDefault()
            return
          }
          onOpen()
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onLeave}
        aria-haspopup="dialog"
        aria-label={`${entry.number} — ${entry.title}. ${entry.caption}`}
        data-cursor={entry.cursor}
        className={cn(
          'group block w-full touch-manipulation select-none rounded-card text-left',
          draggable && 'cursor-grab active:cursor-grabbing',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-4 focus-visible:ring-offset-page-bg',
          lifted && 'invisible',
        )}
      >
        <div ref={magnetRef} className="will-change-transform">
          {/* Ảnh in trên giấy sáng — luôn sáng trên mặt bàn tối, nên dùng màu cố định wm-* */}
          <figure
            data-print
            data-tilt={tilt}
            className="rounded-control bg-wm-mist p-2.5 pb-4 text-wm-charcoal md:p-3 md:pb-5"
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            <div className={cn('overflow-hidden rounded-control bg-wm-stone', aspect)}>
              <img
                src={photoUrl(entry.photo.id, 800)}
                srcSet={photoSrcSet(entry.photo.id)}
                sizes="(min-width: 1024px) 34vw, (min-width: 768px) 46vw, 90vw"
                alt={entry.photo.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="pointer-events-none h-full w-full object-cover saturate-[.7] transition-transform duration-700 ease-editorial group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4 px-1">
              <span className="text-xs font-medium text-wm-graphite tnum">{entry.number}</span>
              <span className="text-right font-display text-base font-semibold md:text-lg">{entry.title}</span>
            </figcaption>
          </figure>
          {/* Chú thích rõ dần khi rê/focus — trên cảm ứng luôn hiện đủ */}
          <p className="mt-3 px-1 text-sm leading-relaxed text-page-muted transition-opacity duration-300 [@media(hover:hover)]:opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100">
            {entry.caption}
          </p>
        </div>
      </button>
    </div>
  )
})

export default ArchiveItem
