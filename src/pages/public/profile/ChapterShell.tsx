import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { gsap } from '@utils/gsap'
import { FINE_POINTER, useMediaQuery } from '@hooks/useMediaQuery'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FOCUS } from '@utils/focus'
import { useBento } from './bentoContext'

type Props = {
  /** Số thứ tự, vd. "02" */
  no: string
  title: string
  /** Tiêu đề chỉ là nhãn nhỏ (khối mở đầu đã có h1) */
  plainTitle?: boolean
  /** Nội dung; `editing` = đang ở chế độ nhập */
  children: (editing: boolean) => ReactNode
  /** Vị trí trong lưới 12×6 (desktop), vd. "lg:col-span-5 lg:row-span-3 …" */
  area: string
  /** Khối chỉ xem (không có nút Sửa/Xong) */
  noEdit?: boolean
  className?: string
}

/**
 * Một ô của lưới bento: thẻ sáng, số + tiêu đề nhỏ, nút Sửa/Xong.
 * - Rê chuột (chuột thật): nổi lên 4px, nghiêng nhẹ ≤ 3°.
 * - Sửa (desktop): ô phóng ra phủ cả khung lưới (FLIP thủ công), ô khác lùi nhẹ; Xong thì thu về.
 * - Mobile: mở rộng tại chỗ, không phóng.
 */
export default function ChapterShell({ no, title, plainTitle, children, area, noEdit, className = '' }: Props) {
  const id = `ch-${no}`
  const { editingId, setEditingId } = useBento()
  const editing = editingId === id
  const desktop = useMediaQuery('(min-width: 1024px)')
  const reduced = useReducedMotion()
  const fine = useMediaQuery(FINE_POINTER)

  const outerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Hình chữ nhật của ô ngay trước khi đổi chế độ (đo ở handler, dùng ở layout effect)
  const firstRect = useRef<DOMRect | null>(null)
  const prevEditing = useRef(editing)
  const prevOther = useRef(false)

  const toggle = () => {
    // Trả thẻ về thế thẳng trước khi đo/phóng — nếu không, độ nghiêng do rê chuột còn giữ nguyên
    // trong lúc khối phóng ra phủ lưới (lúc sửa không có hiệu ứng nghiêng để kéo nó về)
    if (cardRef.current) {
      gsap.killTweensOf(cardRef.current)
      gsap.set(cardRef.current, { y: 0, rotateX: 0, rotateY: 0 })
    }
    firstRect.current = outerRef.current?.getBoundingClientRect() ?? null
    setEditingId(editing ? null : id)
  }

  // FLIP: ô đã ở chỗ mới (phủ lưới / về ô cũ) → chạy ngược từ chỗ cũ về 0
  useLayoutEffect(() => {
    if (prevEditing.current === editing) return
    prevEditing.current = editing
    const el = outerRef.current
    const body = bodyRef.current
    const first = firstRect.current
    firstRect.current = null
    if (!el || !body) return
    if (reduced || !desktop || !first) {
      // Chỉ đổi chỗ + hiện dần
      gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      return
    }
    const last = el.getBoundingClientRect()
    gsap.killTweensOf(el)
    gsap.set(el, { zIndex: 20, transformOrigin: '0 0' })
    gsap.fromTo(
      el,
      { x: first.left - last.left, y: first.top - last.top, scaleX: first.width / last.width, scaleY: first.height / last.height },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.45, ease: 'power3.inOut', clearProps: 'zIndex,transformOrigin' },
    )
    // Nội dung mờ đi lúc bay, hiện lại khi xong để không thấy chữ méo
    gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.3 })
  }, [editing, desktop, reduced])

  // Khối khác đang sửa → lùi nhẹ
  const other = editingId !== null && !editing
  useEffect(() => {
    if (prevOther.current === other) return
    prevOther.current = other
    if (!outerRef.current) return
    gsap.to(outerRef.current, { scale: other ? 0.98 : 1, opacity: other ? 0.5 : 1, duration: reduced ? 0.2 : 0.35, ease: 'power2.out', overwrite: 'auto' })
  }, [other, reduced])

  // Hiệu ứng rê chuột trên thẻ (chỉ chuột thật, không khi có khối đang sửa)
  const tiltOn = fine && editingId === null
  // Có khối bắt đầu sửa → mọi thẻ về thế thẳng (tween nghiêng đang chạy dở cũng dừng)
  useEffect(() => {
    if (editingId === null || !cardRef.current) return
    gsap.killTweensOf(cardRef.current)
    gsap.to(cardRef.current, { y: 0, rotateX: 0, rotateY: 0, duration: 0.2, ease: 'power2.out' })
  }, [editingId])
  const onMove = (e: React.PointerEvent) => {
    if (!tiltOn || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(cardRef.current, { y: -4, rotateX: -py * 6, rotateY: px * 6, transformPerspective: 900, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  }
  const onLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, { y: 0, rotateX: 0, rotateY: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
  }

  // Esc = Xong
  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingId(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editing, setEditingId])

  // Mobile hoặc đang sửa: ô phủ cả lưới (desktop) — các ô còn lại giữ nguyên vị trí vì đã đặt cột/hàng cụ thể
  const place = editing && desktop ? 'lg:absolute lg:inset-0 lg:z-20' : area

  return (
    <div ref={outerRef} data-tile className={`${place} min-h-0 ${className}`}>
      <section
        ref={cardRef}
        aria-labelledby={id}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="theme-ivory flex h-full min-h-0 flex-col rounded-card bg-page-bg p-5 text-page-fg"
      >
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="font-display text-2xl text-page-muted">{no}</span>
            {plainTitle ? (
              <p id={id} className="text-base font-semibold">{title}</p>
            ) : (
              <h2 id={id} className="text-base font-semibold">{title}</h2>
            )}
          </div>
          {!noEdit && <button
            type="button"
            onClick={toggle}
            aria-pressed={editing}
            className={`shrink-0 rounded-full border px-3.5 py-1 text-sm transition-colors duration-200 ${FOCUS} ${
              editing ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-edge text-page-fg hover:border-page-fg'
            }`}
          >
            {editing ? 'Xong' : 'Sửa'}
          </button>}
        </div>
        <div ref={bodyRef} className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain text-sm">{children(editing)}</div>
      </section>
    </div>
  )
}
