import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FINE_POINTER, useMediaQuery } from '@hooks/useMediaQuery'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { FOCUS } from '@utils/focus'

type Props = {
  photo: Photo
  title: string
  /** Dòng chữ nhỏ in hoa trên tiêu đề, vd. "Quán Gió Sông Hàn · Sơn Trà" */
  eyebrow: string
  /** Điểm phù hợp 0–100, vẽ ở ô điểm đè mép ảnh */
  score: number
  /** Thẻ vừa bấm (nút chứa ảnh có [data-print]) — tấm ảnh bay ra từ đúng chỗ này và về lại đó khi đóng */
  origin: HTMLElement | null
  /** Hiệu ứng đóng chạy xong → cha gỡ khung khỏi cây */
  onClosed: () => void
  /** Nội dung cột phải, dưới tiêu đề (ô thông tin, tiêu chí, gợi ý, giới thiệu…) */
  children: ReactNode
  /**
   * Hàng nút hành động ghim ở đáy. Dạng hàm nhận `close` để đóng sau khi bấm; `close(true)` = đóng bằng mờ dần
   * (dùng khi hành động làm thẻ rời khỏi danh sách nên không còn chỗ để thu về).
   */
  actions?: ReactNode | ((close: (quick?: boolean) => void) => ReactNode)
}

/** Tấm ảnh trong thẻ gốc */
const printOf = (origin: HTMLElement) => origin.querySelector<HTMLElement>('[data-print]') ?? origin

/** Mức theo điểm, khớp nhãn của MatchScore */
function levelOf(score: number) {
  if (score >= 80) return 'Rất phù hợp'
  if (score >= 60) return 'Phù hợp'
  if (score >= 40) return 'Có thể phù hợp'
  return 'Ít phù hợp'
}

/**
 * Tấm bay co giãn không đều (scaleX ≠ scaleY); bù ngược cho ảnh bên trong
 * để ảnh luôn đúng tỉ lệ (vẫn phủ kín nhờ overflow-hidden).
 */
function keepPhotoRatio(fly: HTMLElement, img: HTMLElement | null) {
  if (!img) return
  const sx = Number(gsap.getProperty(fly, 'scaleX'))
  const sy = Number(gsap.getProperty(fly, 'scaleY'))
  const s = Math.max(sx, sy)
  img.style.transform = `scale(${s / sx}, ${s / sy})`
}

const clampHalf = (n: number) => Math.min(0.5, Math.max(-0.5, n))
/** Độ nghiêng tối đa theo chuột (độ) = TILT / 2 */
const TILT = 16
/** Độ lệch của tấm nền đá so với ảnh (px) */
const PLATE = 14

/**
 * Chi tiết một thẻ ở /match. Desktop: hai cột — trái là "sân khấu ảnh" (ảnh lớn nghiêng như tấm ảnh in đặt trên bàn,
 * chồi ra ngoài mép trên/trái khung, nghiêng 3D theo chuột, ô điểm đè mép dưới), phải là nội dung cuộn riêng + hàng nút ghim đáy.
 * Mở: một tấm ảnh `fixed` bay từ thẻ gốc tới đúng chỗ ảnh chồi ra (lật nhẹ rồi đáp), khung và nội dung hiện sau.
 * Đóng: ngược lại. Esc / nút X / bấm nền để đóng. "Giảm chuyển động": chỉ hiện/mờ. Mobile: bottom sheet, ảnh chồi lên mép trên.
 */
export default function MatchDetail({ photo, title, eyebrow, score, origin, onClosed, children, actions }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // Sân khấu ảnh: slab = hộp đích của tấm bay; plate/photo/badge là ba lớp ở các độ sâu khác nhau
  const slabRef = useRef<HTMLDivElement>(null)
  const plateRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)
  const flyImgRef = useRef<HTMLImageElement>(null)

  const reduced = useReducedMotion()
  const fine = useMediaQuery(FINE_POINTER)
  const desktop = useMediaQuery('(min-width: 768px)')
  // Góc nghiêng khi nằm yên và độ lệch tấm nền: nhẹ hơn trên mobile
  const restRot = desktop ? -3 : -2
  const plateOff = desktop ? PLATE : 8

  const [closing, setClosing] = useState(false)
  // quick = đóng bằng mờ dần, không thu về thẻ
  const quick = useRef(false)
  const requestClose = useCallback((fade?: boolean) => {
    quick.current = !!fade
    setClosing(true)
  }, [])
  // Chỉ nghiêng theo chuột sau khi ảnh đã đáp
  const landed = useRef(false)
  const originRef = useRef(origin)

  /** Đặt tấm bay trùng hộp slab (đo khi chưa bị tilt; tâm không đổi dù slab đang nghiêng) rồi trả tâm */
  const placeFly = () => {
    const slab = slabRef.current!
    const w = slab.offsetWidth
    const h = slab.offsetHeight
    const r = slab.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    gsap.set(flyRef.current, { left: cx - w / 2, top: cy - h / 2, width: w, height: h })
    return { cx, cy, w, h }
  }

  /** Thế của tấm bay khi nằm ở thẻ gốc (x, y, scale tính từ vị trí đích) */
  const fromPrint = (c: { cx: number; cy: number; w: number; h: number }, o: HTMLElement) => {
    const r = printOf(o).getBoundingClientRect()
    return {
      x: r.left + r.width / 2 - c.cx,
      y: r.top + r.height / 2 - c.cy,
      scaleX: r.width / c.w,
      scaleY: r.height / c.h,
    }
  }

  // Mở
  useGSAP(
    () => {
      const panel = panelRef.current!
      const fly = flyRef.current!
      const plate = plateRef.current!
      const photoEl = photoRef.current!
      const badge = badgeRef.current!
      const bars = gsap.utils.toArray<HTMLElement>('[data-bar]')

      // Thế nằm yên của các lớp trên sân khấu
      gsap.set(slabRef.current, { rotation: restRot })
      gsap.set(plate, { x: plateOff, y: plateOff, rotation: desktop ? 4 : 2 })
      gsap.fromTo('[data-backdrop]', { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.3, ease: 'power2.out' })

      if (reduced || !origin) {
        landed.current = true
        gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.25 })
        return
      }

      // Ảnh thật, tấm nền và ô điểm chờ đến khi tấm bay đáp
      gsap.set(photoEl, { opacity: 0 })
      const c = placeFly()
      const fit = () => keepPhotoRatio(fly, flyImgRef.current)
      gsap.set(fly, { ...fromPrint(c, origin), rotation: 0, autoAlpha: 1 })
      fit()
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' })

      const land = 0.75
      gsap
        .timeline()
        // Bay tới chỗ đáp, đồng thời lật nhẹ: xoay quá tay rồi đáp về góc nằm yên
        .to(fly, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: land, ease: 'power3.inOut', onUpdate: fit }, 0)
        .to(fly, { rotation: -7, duration: 0.4, ease: 'power2.out' }, 0)
        .to(fly, { rotation: restRot, duration: 0.35, ease: 'power2.inOut' }, 0.4)
        // Khung nền + nội dung hiện dần cùng lúc ảnh sắp đáp
        .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.35)
        .from('[data-body]', { opacity: 0, y: 12, duration: 0.4, ease: 'power2.out' }, 0.55)
        // Đáp: đổi sang ảnh thật, tấm nền đá và ô điểm bật ra ngay sau đó
        .add(() => {
          gsap.set(photoEl, { opacity: 1 })
          gsap.set(fly, { autoAlpha: 0 })
          landed.current = true
        }, land)
        .fromTo(plate, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, land)
        .fromTo(badge, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }, land + 0.08)
        // Thanh tiêu chí chạy từ 0 tới giá trị, lần lượt
        .to(bars, { scaleX: (_i: number, el: HTMLElement) => Number(el.dataset.v), duration: 0.6, stagger: 0.07, ease: 'power3.out' }, land + 0.05)
    },
    { scope: rootRef },
  )

  // Đóng
  useGSAP(
    () => {
      if (!closing) return
      landed.current = false
      // Thẻ gốc đã rời danh sách (không còn trong DOM) → không có chỗ để thu về, mờ dần thay thế
      if (reduced || quick.current || !origin?.isConnected) {
        gsap.to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.25, onComplete: onClosed })
        return
      }
      const fly = flyRef.current!
      const fit = () => keepPhotoRatio(fly, flyImgRef.current)
      const c = placeFly()
      const back = fromPrint(c, origin)
      // Tấm bay thế chỗ ảnh thật (trả thế thẳng cho các lớp đang nghiêng theo chuột)
      gsap.set(photoRef.current, { opacity: 0, rotationX: 0, rotationY: 0 })
      gsap.set(imgRef.current, { x: 0, y: 0, scale: 1 })
      gsap.set(fly, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: restRot, autoAlpha: 1 })
      fit()
      gsap
        .timeline({ onComplete: onClosed })
        .to([plateRef.current, badgeRef.current], { opacity: 0, scale: 0.9, duration: 0.2, ease: 'power2.in' }, 0)
        .to('[data-body]', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
        .to(panelRef.current, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.1)
        .to('[data-backdrop]', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.2)
        .to(fly, { ...back, duration: 0.6, ease: 'power3.inOut', onUpdate: fit }, 0.15)
        .to(fly, { rotation: -7, duration: 0.3, ease: 'power2.out' }, 0.15)
        .to(fly, { rotation: 0, duration: 0.3, ease: 'power2.inOut' }, 0.45)
    },
    { scope: rootRef, dependencies: [closing] },
  )

  // Nghiêng 3D theo chuột: ảnh xoay, ảnh bên trong trôi ngược, ô điểm ở lớp gần (dịch nhiều hơn), tấm nền dịch ngược
  const { contextSafe } = useGSAP({ scope: rootRef })
  const tiltOn = fine && desktop

  const onMove = contextSafe((e: PointerEvent<HTMLDivElement>) => {
    if (!tiltOn || !landed.current || closing) return
    const r = slabRef.current!.getBoundingClientRect()
    const rx = clampHalf((e.clientX - r.left) / r.width - 0.5)
    const ry = clampHalf((e.clientY - r.top) / r.height - 0.5)
    const base = { transformPerspective: 1100, duration: 0.6, ease: 'power3.out', overwrite: 'auto' as const }
    gsap.to(photoRef.current, { rotationY: rx * TILT, rotationX: -ry * TILT, ...base })
    gsap.to(imgRef.current, { x: -rx * 24, y: -ry * 24, scale: 1.1, ...base })
    gsap.to(badgeRef.current, { x: rx * 43, y: ry * 43, z: 60, rotationY: rx * TILT, rotationX: -ry * TILT, ...base })
    gsap.to(plateRef.current, { x: plateOff - rx * 16, y: plateOff - ry * 16, ...base })
  })

  const onLeave = contextSafe(() => {
    if (!tiltOn || !landed.current) return
    const base = { duration: 0.9, ease: 'power3.out', overwrite: 'auto' as const }
    gsap.to(photoRef.current, { rotationX: 0, rotationY: 0, ...base })
    gsap.to(imgRef.current, { x: 0, y: 0, scale: 1, ...base })
    gsap.to(badgeRef.current, { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, ...base })
    gsap.to(plateRef.current, { x: plateOff, y: plateOff, ...base })
  })

  // Esc, giữ focus trong khung, khóa cuộn nền (bù độ rộng thanh cuộn), trả focus về thẻ khi gỡ
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        requestClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const back = originRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      // Thẻ đã rời danh sách (vd. vừa ứng tuyển) thì không còn gì để trả focus về
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [requestClose])

  const titleId = 'match-detail-title'
  const value = Math.round(Math.min(100, Math.max(0, score)))
  const imgProps = {
    src: photoUrl(photo.id, 960),
    srcSet: photoSrcSet(photo.id),
    sizes: '(min-width: 768px) 32rem, 90vw',
  }

  return createPortal(
    // data-lenis-prevent: Lenis (đang chạy ở chế độ Bộ sưu tập) không nuốt cuộn chuột trong khung này
    <div ref={rootRef} data-lenis-prevent className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-14">
      {/* Nền phủ: bấm ra ngoài thì đóng */}
      <div data-backdrop aria-hidden onClick={() => requestClose()} className="absolute inset-0 bg-wm-charcoal/40" />

      {/* Khung chính overflow-visible để ảnh chồi ra; mobile là bottom sheet cao tối đa 90svh */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative flex max-h-[90svh] w-full flex-col rounded-t-card border border-page-line bg-wm-ivory text-wm-charcoal md:grid md:min-h-[34rem] md:max-h-none md:max-w-5xl md:grid-cols-12 md:rounded-card"
      >
        {/* Sân khấu ảnh */}
        <div
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="relative z-10 h-[13rem] shrink-0 md:col-span-5 md:h-auto"
        >
          {/* slab: hộp của ảnh chồi ra (mobile: chồi lên mép trên sheet 24px; desktop: ra trên + trái 40px, cao theo khung) */}
          <div
            ref={slabRef}
            className="absolute inset-x-5 -top-6 h-56 md:-left-10 md:-top-10 md:right-6 md:bottom-14 md:inset-x-auto md:h-auto"
          >
            {/* Tấm nền đá lệch xuống-phải, nghiêng ngược: thay cho bóng đổ */}
            <div ref={plateRef} aria-hidden className="absolute inset-0 rounded-card bg-wm-stone" />
            <div ref={photoRef} className="absolute inset-0">
              <div className="h-full w-full overflow-hidden rounded-card bg-wm-stone">
                <img ref={imgRef} {...imgProps} alt={photo.alt} draggable={false} className="h-full w-full object-cover" />
              </div>
            </div>
            {/* Ô điểm ở lớp gần nhất */}
            <div
              ref={badgeRef}
              role="img"
              aria-label={`Độ phù hợp ${value}%, ${levelOf(value)}`}
              className="absolute -right-3 bottom-6 rounded-card bg-wm-charcoal px-5 py-3 text-wm-ivory"
            >
              <p className="tnum font-display text-4xl font-medium leading-none md:text-5xl">{value}%</p>
              <p className="mt-1.5 text-xs">{levelOf(value)}</p>
            </div>
          </div>
        </div>

        {/* Cột nội dung: cuộn riêng, nút ghim đáy */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden md:col-span-7 md:max-h-[calc(100svh-7rem)] md:rounded-r-card">
          <div data-body className="flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-4 px-6 pt-5 md:px-8">
              <p className="min-w-0 truncate text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{eyebrow}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={() => requestClose()}
                aria-label="Đóng"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-page-line transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8 md:px-8">
              <h2 id={titleId} className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
                {title}
              </h2>
              {children}
            </div>

            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-page-line bg-page-bg px-6 py-4 md:px-8">
                {typeof actions === 'function' ? actions(requestClose) : actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tấm ảnh bay (fixed): từ thẻ gốc tới chỗ ảnh chồi ra, và ngược lại khi đóng. Ẩn khi không bay. */}
      <div ref={flyRef} aria-hidden className="pointer-events-none invisible fixed z-20 overflow-hidden rounded-card bg-wm-stone">
        <img ref={flyImgRef} {...imgProps} alt="" className="h-full w-full object-cover" />
      </div>
    </div>,
    document.body,
  )
}
