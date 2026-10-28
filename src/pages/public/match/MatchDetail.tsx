import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { FOCUS } from '@utils/focus'

type Props = {
  photo: Photo
  title: string
  subtitle?: string
  /** Thẻ vừa bấm (nút chứa ảnh có [data-print]) — khung phóng ra từ đúng tấm ảnh này và thu về đó khi đóng */
  origin: HTMLElement | null
  /** Hiệu ứng đóng chạy xong → cha gỡ khung khỏi cây */
  onClosed: () => void
  /** Nội dung chi tiết (điểm, tiêu chí, ca/lương…) */
  children: ReactNode
  /**
   * Hàng nút hành động. Dạng hàm nhận `close` để đóng sau khi bấm; `close(true)` = đóng bằng mờ dần
   * (dùng khi hành động làm thẻ rời khỏi danh sách nên không còn chỗ để thu về).
   */
  actions?: ReactNode | ((close: (quick?: boolean) => void) => ReactNode)
}

/** Tấm ảnh trong thẻ gốc */
const printOf = (origin: HTMLElement) => origin.querySelector<HTMLElement>('[data-print]') ?? origin

/**
 * Transform để `panel` (đang ở vị trí/kích thước thật giữa màn hình) trùng khít tấm ảnh trong thẻ:
 * cùng tâm, cùng kích thước. Phải đo khi panel CHƯA bị transform.
 */
function fromPrint(panel: HTMLElement, origin: HTMLElement) {
  const o = printOf(origin).getBoundingClientRect()
  const p = panel.getBoundingClientRect()
  return {
    x: o.left + o.width / 2 - (p.left + p.width / 2),
    y: o.top + o.height / 2 - (p.top + p.height / 2),
    scaleX: o.width / p.width,
    scaleY: o.height / p.height,
  }
}

/**
 * Khung co giãn không đều (scaleX ≠ scaleY) khi bay; bù ngược cho ảnh phủ bên trong
 * để ảnh luôn đúng tỉ lệ (vẫn phủ kín nhờ overflow-hidden).
 */
function keepPhotoRatio(panel: HTMLElement, img: HTMLElement | null) {
  if (!img) return
  const sx = Number(gsap.getProperty(panel, 'scaleX'))
  const sy = Number(gsap.getProperty(panel, 'scaleY'))
  const s = Math.max(sx, sy)
  img.style.transform = `scale(${s / sx}, ${s / sy})`
}

/**
 * Chi tiết một thẻ ở /match: tấm ảnh trong thẻ phóng ra giữa màn hình rồi hiện nội dung
 * (cùng cách với trang Cá nhân, bản gọn). Esc / nút X / bấm nền để đóng; đóng thì thu về đúng thẻ.
 * "Giảm chuyển động": chỉ hiện/mờ. Trên điện thoại là bottom sheet cuộn được bên trong.
 */
export default function MatchDetail({ photo, title, subtitle, origin, onClosed, children, actions }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const coverImgRef = useRef<HTMLImageElement>(null)
  const reduced = useReducedMotion()
  const [closing, setClosing] = useState(false)
  // quick = đóng bằng mờ dần, không thu về thẻ
  const quick = useRef(false)
  const requestClose = useCallback((fade?: boolean) => {
    quick.current = !!fade
    setClosing(true)
  }, [])
  // Vị trí thẻ lúc mở — dùng lại khi đóng
  const start = useRef<ReturnType<typeof fromPrint> | null>(null)
  const originRef = useRef(origin)

  // Mở
  useGSAP(
    () => {
      const panel = panelRef.current!
      gsap.fromTo('[data-backdrop]', { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.3, ease: 'power2.out' })
      if (reduced || !origin) {
        gsap.set('[data-cover]', { opacity: 0 })
        gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.25 })
        return
      }
      start.current = fromPrint(panel, origin)
      const fit = () => keepPhotoRatio(panel, coverImgRef.current)
      gsap
        .timeline()
        .from(panel, { ...start.current, duration: 0.7, ease: 'power3.inOut', onUpdate: fit, onStart: fit })
        .to('[data-cover]', { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.62)
        .from('[data-body]', { opacity: 0, y: 12, duration: 0.35, ease: 'power2.out' }, 0.62)
    },
    { scope: rootRef },
  )

  // Đóng
  useGSAP(
    () => {
      if (!closing) return
      const panel = panelRef.current!
      // Thẻ gốc đã rời danh sách (không còn trong DOM) → không có chỗ để thu về, mờ dần thay thế
      if (reduced || quick.current || !origin?.isConnected || !start.current) {
        gsap.to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.25, onComplete: onClosed })
        return
      }
      gsap
        .timeline({ onComplete: onClosed })
        .to('[data-body]', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
        .to('[data-cover]', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.05)
        .to('[data-backdrop]', { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.2)
        .to(panel, {
          ...start.current,
          duration: 0.6,
          ease: 'power3.inOut',
          onUpdate: () => keepPhotoRatio(panel, coverImgRef.current),
        }, 0.2)
    },
    { scope: rootRef, dependencies: [closing] },
  )

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

  return createPortal(
    // data-lenis-prevent: Lenis (đang chạy ở chế độ Bộ sưu tập) không nuốt cuộn chuột trong khung này
    <div ref={rootRef} data-lenis-prevent className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-8">
      {/* Nền phủ: bấm ra ngoài thì đóng */}
      <div data-backdrop aria-hidden onClick={() => requestClose()} className="absolute inset-0 bg-wm-charcoal/40" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative flex max-h-[90svh] w-full flex-col overflow-hidden rounded-t-card border border-page-line bg-wm-ivory text-wm-charcoal will-change-transform md:max-h-[84svh] md:max-w-5xl md:rounded-card"
      >
        {/* Ảnh phủ kín khung trong lúc bay — để thấy chính tấm ảnh được phóng to */}
        <div data-cover aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden bg-wm-stone">
          <img
            ref={coverImgRef}
            src={photoUrl(photo.id, 1400)}
            srcSet={photoSrcSet(photo.id)}
            sizes="(min-width: 768px) 64rem, 100vw"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div data-body className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-page-line px-6 py-4 md:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Chi tiết</p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => requestClose()}
              aria-label="Đóng"
              className={`grid h-10 w-10 place-items-center rounded-full border border-page-line transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-8 px-6 py-8 md:grid-cols-12 md:gap-10 md:px-8 md:py-10">
              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-card bg-wm-stone md:sticky md:top-0">
                  <img
                    src={photoUrl(photo.id, 960)}
                    srcSet={photoSrcSet(photo.id)}
                    sizes="(min-width: 768px) 40vw, 90vw"
                    alt={photo.alt}
                    className="aspect-[16/10] w-full object-cover md:aspect-[4/5]"
                  />
                </div>
              </div>
              <div className="min-w-0 md:col-span-7">
                <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl">
                  {title}
                </h2>
                {subtitle && <p className="mt-2 text-sm text-page-muted">{subtitle}</p>}
                <div className="mt-6">{children}</div>
                {actions && (
                  <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-page-line pt-6">
                    {typeof actions === 'function' ? actions(requestClose) : actions}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
