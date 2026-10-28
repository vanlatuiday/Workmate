import { forwardRef, useEffect, useRef, useState } from 'react'
import { gsap } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoUrl, type Photo } from '@components/discover/types'
import { personInitials } from '../match/parts'

export interface TopCandidate { name: string; score: number }

interface Props {
  photos: Photo[]
  photoIndex: number
  title: string
  subtitle: string
  count: number
  total: number
  top: TopCandidate[]
  posted: boolean
}

/** Xem trước tin: thẻ như ở Bộ sưu tập + số ứng viên phù hợp cập nhật trực tiếp. */
const PostPreview = forwardRef<HTMLDivElement, Props>(function PostPreview(
  { photos, photoIndex, title, subtitle, count, total, top, posted },
  cardRef,
) {
  const reduced = useReducedMotion()
  // Chỉ nạp ảnh đã từng được chọn, tránh tải cả sáu ảnh lớn
  const [seen, setSeen] = useState<number[]>([photoIndex])
  const [shown, setShown] = useState(count)
  const [delta, setDelta] = useState(0)
  const prev = useRef(count)
  const counter = useRef({ v: count })
  const stamp = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSeen((s) => (s.includes(photoIndex) ? s : [...s, photoIndex]))
  }, [photoIndex])

  // Đếm lên/xuống mượt; giảm chuyển động thì đổi ngay
  useEffect(() => {
    if (count === prev.current) return
    setDelta(count - prev.current)
    prev.current = count
    if (reduced) {
      counter.current.v = count
      setShown(count)
      return
    }
    const tween = gsap.to(counter.current, { v: count, duration: 0.6, ease: 'power2.out', onUpdate: () => setShown(Math.round(counter.current.v)) })
    return () => { tween.kill() }
  }, [count, reduced])

  // Con dấu ĐÃ ĐĂNG đập xuống, thẻ rung nhẹ khi dấu chạm
  useEffect(() => {
    if (!posted || !stamp.current) return
    if (reduced) {
      gsap.set(stamp.current, { opacity: 1, rotation: -12 })
      return
    }
    const card = (cardRef as React.RefObject<HTMLDivElement>).current
    const tween = gsap.fromTo(
      stamp.current,
      { scale: 1.8, opacity: 0, rotation: -12 },
      {
        scale: 1, opacity: 1, rotation: -12, duration: 0.45, ease: 'power4.out',
        onComplete: () => { if (card) gsap.fromTo(card, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }) },
      },
    )
    return () => { tween.kill() }
  }, [posted, reduced, cardRef])

  return (
    <div className="space-y-6">
      <div ref={cardRef} className="relative">
        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-page-surface">
          {seen.map((i) => (
            <img
              key={i}
              src={photoUrl(photos[i].id, 800)}
              alt={i === photoIndex ? photos[i].alt : ''}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: i === photoIndex ? 1 : 0 }}
            />
          ))}
        </div>
        <div className="mt-3 border-b border-page-line pb-4">
          <p className="font-display text-lg font-medium text-page-fg">{title || 'Tên vị trí của bạn'}</p>
          <p className="mt-1 text-sm text-page-muted">{subtitle}</p>
        </div>
        {posted && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div
              ref={stamp}
              className="rounded-card border-[3px] border-page-fg bg-page-bg px-5 py-2 font-display text-3xl font-semibold uppercase tracking-wide text-page-fg"
              style={{ opacity: 0 }}
            >
              Đã đăng
            </div>
          </div>
        )}
      </div>

      <section aria-label="Ứng viên phù hợp ngay lúc này" className="rounded-card border border-page-line p-5">
        <p className="text-sm text-page-muted">Ứng viên phù hợp ngay lúc này</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="tnum font-display text-display-md font-semibold leading-none text-page-fg">{shown}</span>
          <span className="pb-1 text-sm text-page-muted">/ {total} ứng viên</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < count ? 'h-2 w-2 rounded-full bg-page-fg' : 'h-2 w-2 rounded-full border border-page-line'} />
          ))}
        </div>
        <p className="mt-3 min-h-[1.25rem] text-sm text-page-fg" aria-live="polite">
          {delta !== 0 && <>{delta > 0 ? '↑ +' : '↓ −'}{Math.abs(delta)} so với trước</>}
        </p>
        <ul className="mt-3 space-y-2">
          {top.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-3 text-page-fg">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-page-line text-xs">{personInitials(c.name)}</span>
                {c.name}
              </span>
              <span className="tnum text-page-muted">{c.score}%</span>
            </li>
          ))}
          {top.length === 0 && <li className="text-sm text-page-muted">Chưa có ứng viên nào đủ gần và đủ khớp.</li>}
        </ul>
        <p className="mt-4 text-xs text-page-muted">Dữ liệu mẫu</p>
      </section>
    </div>
  )
})

export default PostPreview
