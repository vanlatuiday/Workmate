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
  /** Đang mở trong tấm hồ sơ → ẩn tại chỗ như thể đã được nhấc lên */
  lifted: boolean
  onOpen: () => void
}

/**
 * Một tấm ảnh trong không gian hồ sơ. Rê chuột → tấm ảnh bị "hút" nhẹ theo con trỏ,
 * ảnh bên trong phóng nhẹ, dòng chú thích rõ dần. Bấm / Enter / Space → mở nội dung.
 * Lớp ngoài (`data-archive-item`, do PersonalArchive điều khiển khi cuộn) và lớp hút
 * (`magnetRef`) tách riêng để hai chuyển động không ghi đè transform của nhau.
 */
const ArchiveItem = forwardRef<HTMLButtonElement, Props>(function ArchiveItem(
  { entry, tilt, aspect, lifted, onOpen },
  ref,
) {
  const magnetRef = useRef<HTMLDivElement>(null)
  const fine = useMediaQuery(FINE_POINTER)
  const { contextSafe } = useGSAP({ scope: magnetRef })

  const onMove = contextSafe((e: PointerEvent<HTMLButtonElement>) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    gsap.to(magnetRef.current, {
      x: dx * 18,
      y: dy * 18,
      rotation: dx * 1.5,
      duration: 0.7,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  })

  const onLeave = contextSafe(() => {
    gsap.to(magnetRef.current, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)', overwrite: 'auto' })
  })

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-haspopup="dialog"
      aria-label={`${entry.number} — ${entry.title}. ${entry.caption}`}
      data-cursor={entry.cursor}
      className={cn(
        'group block w-full rounded-card text-left transition-opacity duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-4 focus-visible:ring-offset-page-bg',
        lifted && 'opacity-0',
      )}
    >
      <div ref={magnetRef} className="will-change-transform">
        <figure
          className="rounded-card border border-page-line bg-page-surface p-2.5 pb-4 md:p-3 md:pb-5"
          style={{ transform: `rotate(${tilt}deg)` }}
        >
          <div className={cn('overflow-hidden rounded-control bg-page-line', aspect)}>
            <img
              src={photoUrl(entry.photo.id, 800)}
              srcSet={photoSrcSet(entry.photo.id)}
              sizes="(min-width: 1024px) 34vw, (min-width: 768px) 46vw, 90vw"
              alt={entry.photo.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover saturate-[.7] transition-transform duration-700 ease-editorial group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-4 px-1">
            <span className="text-xs font-medium text-page-muted tnum">{entry.number}</span>
            <span className="text-right font-display text-base font-semibold md:text-lg">{entry.title}</span>
          </figcaption>
        </figure>
        {/* Chú thích rõ dần khi rê/focus — trên cảm ứng luôn hiện đủ */}
        <p className="mt-3 px-1 text-sm leading-relaxed text-page-muted transition-opacity duration-300 [@media(hover:hover)]:opacity-75 group-hover:opacity-100 group-focus-visible:opacity-100">
          {entry.caption}
        </p>
      </div>
    </button>
  )
})

export default ArchiveItem
