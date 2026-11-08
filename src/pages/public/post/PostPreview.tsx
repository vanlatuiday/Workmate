import { forwardRef, useEffect, useRef, useState } from 'react'
import { gsap } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import Tilt from '@components/motion/Tilt'
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
  const numRef = useRef<HTMLSpanElement>(null)
  const deltaRef = useRef<HTMLParagraphElement>(null)
  const lastChar = useRef<HTMLSpanElement>(null)
  const prevLen = useRef(title.length)

  // Chỉ ký tự mới gõ hiện dần (mờ → rõ, nhích lên); xóa chữ hoặc giảm chuyển động thì đổi ngay
  useEffect(() => {
    const grew = title.length > prevLen.current
    prevLen.current = title.length
    if (!grew || reduced || !lastChar.current) return
    const t = gsap.fromTo(lastChar.current, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' })
    return () => { t.kill() }
  }, [title, reduced])

  useEffect(() => {
    setSeen((s) => (s.includes(photoIndex) ? s : [...s, photoIndex]))
  }, [photoIndex])

  // Đếm lên/xuống mượt; giảm chuyển động thì đổi ngay
  useEffect(() => {
    if (count === prev.current) return
    setDelta(count - prev.current)
    prev.current = count
    // Số "nảy" và dòng chênh lệch trượt vào
    if (!reduced) {
      if (numRef.current) gsap.fromTo(numRef.current, { scale: 1 }, { keyframes: { scale: [1, 1.08, 1] }, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
      if (deltaRef.current) gsap.fromTo(deltaRef.current, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
    }
    if (reduced) {
      counter.current.v = count
      setShown(count)
      return
    }
    const tween = gsap.to(counter.current, { v: count, duration: 0.6, ease: 'power2.out', onUpdate: () => setShown(Math.round(counter.current.v)) })
    return () => { tween.kill() }
  }, [count, reduced])

  // Con dấu ĐÃ GỬI DUYỆT đập xuống, thẻ rung nhẹ khi dấu chạm
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
        <Tilt>
        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-page-surface">
          {seen.map((i) => (
            <img
              key={i}
              data-tilt-media
              src={photoUrl(photos[i].id, 800)}
              alt={i === photoIndex ? photos[i].alt : ''}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: i === photoIndex ? 1 : 0 }}
            />
          ))}
        </div>
        </Tilt>
        <div className="mt-3 border-b border-page-line pb-4">
          <p className="font-display text-lg font-medium text-page-fg">{title ? <>{title.slice(0, -1)}<span ref={lastChar} className="inline-block whitespace-pre">{title.slice(-1)}</span></> : 'Tên vị trí của bạn'}</p>
          <p className="mt-1 text-sm text-page-muted">{subtitle}</p>
        </div>
        {posted && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div
              ref={stamp}
              className="rounded-card border-[3px] border-page-fg bg-page-bg px-5 py-2 font-display text-2xl font-semibold uppercase tracking-wide text-page-fg"
              style={{ opacity: 0 }}
            >
              Đã gửi duyệt
            </div>
          </div>
        )}
      </div>

      <section aria-label="Ứng viên phù hợp ngay lúc này" className="rounded-card border border-page-line p-5">
        <p className="text-sm text-page-muted">Ứng viên phù hợp ngay lúc này</p>
        <div className="mt-2 flex items-end gap-3">
          <span ref={numRef} className="tnum inline-block origin-bottom-left font-display text-display-md font-semibold leading-none text-page-fg">{shown}</span>
          <span className="pb-1 text-sm text-page-muted">/ {total} ứng viên</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full border transition-[transform,background-color,border-color] duration-300 motion-reduce:transition-none ${i < count ? 'scale-110 border-page-fg bg-page-fg' : 'border-page-line'}`}
            />
          ))}
        </div>
        <p ref={deltaRef} className="mt-3 min-h-[1.25rem] text-sm text-page-fg" aria-live="polite">
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
      </section>
    </div>
  )
})

export default PostPreview
