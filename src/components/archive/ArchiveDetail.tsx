import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import type { ArchiveEntry } from './types'
import { FOCUS } from '@utils/focus'

type Props = {
  entry: ArchiveEntry
  /** Tấm ảnh vừa bấm — tờ hồ sơ phóng ra từ đúng tấm này và thu về đó khi đóng */
  origin: HTMLElement | null
  /** Đổi sang true để bắt đầu đóng (chạy hiệu ứng ngược) */
  closing: boolean
  /** Gọi khi người dùng muốn đóng (nút X, Esc, bấm ra ngoài) */
  onRequestClose: () => void
  /** Hiệu ứng đóng chạy xong → gỡ khỏi cây */
  onClosed: () => void
  /** Tấm ảnh vừa nhấc khỏi mặt bàn (đầu hiệu ứng mở) */
  onLifted?: () => void
  /** Tấm ảnh vừa chạm lại mặt bàn (gần cuối hiệu ứng đóng) — để nền phản hồi ngay, không chờ gỡ */
  onLanded?: () => void
  /** Nhãn nhỏ trên tiêu đề, vd. "Hồ sơ" */
  eyebrow: string
  /** Class theme cho chữ bên trong tờ hồ sơ (portal ra body nên phải mang theo). Chỉ gắn vào tờ hồ sơ — gắn vào lớp ngoài sẽ phủ màu nền lên cả màn hình */
  themeClass: string
}

/** Tấm ảnh in bên trong nút */
const printOf = (origin: HTMLElement) => origin.querySelector<HTMLElement>('[data-print]') ?? origin

/**
 * Transform để `panel` (đang ở vị trí/kích thước thật giữa màn hình) trùng khít tấm ảnh trên bàn:
 * cùng tâm, cùng kích thước, cùng độ nghiêng. Phải đo khi panel CHƯA bị transform.
 */
function fromPrint(panel: HTMLElement, origin: HTMLElement) {
  const print = printOf(origin)
  const p = panel.getBoundingClientRect()
  const o = print.getBoundingClientRect()
  return {
    x: o.left + o.width / 2 - (p.left + p.width / 2),
    y: o.top + o.height / 2 - (p.top + p.height / 2),
    // offsetWidth/Height = kích thước chưa xoay (rect của phần tử nghiêng thì to hơn)
    scaleX: print.offsetWidth / p.width,
    scaleY: print.offsetHeight / p.height,
    rotation: Number(print.dataset.tilt ?? 0),
  }
}

/**
 * Tờ hồ sơ co giãn không đều (scaleX ≠ scaleY) khi bay giữa tấm ảnh và giữa màn hình.
 * Bù ngược cho ảnh phủ bên trong để ảnh luôn đúng tỉ lệ (vẫn phủ kín nhờ overflow-hidden).
 */
function keepPhotoRatio(panel: HTMLElement, img: HTMLElement | null) {
  if (!img) return
  const sx = Number(gsap.getProperty(panel, 'scaleX'))
  const sy = Number(gsap.getProperty(panel, 'scaleY'))
  const s = Math.max(sx, sy)
  img.style.transform = `scale(${s / sx}, ${s / sy})`
}

/**
 * Tờ hồ sơ = chính tấm ảnh được phóng to. Nền trang giữ nguyên (không phủ tối);
 * các tấm còn lại lùi về sau do PersonalArchive lo.
 * Mở: tấm ảnh nhấc khỏi bàn, xoay thẳng, phóng ra giữa màn hình (ảnh phủ kín lúc bay),
 *      tới nơi thì ảnh phủ mờ đi để lộ nội dung.
 * Đóng: nội dung mờ, ảnh phủ hiện lại, tờ hồ sơ thu về đúng chỗ và độ nghiêng cũ.
 * Trên điện thoại tờ hồ sơ là bottom sheet cuộn được bên trong.
 */
export default function ArchiveDetail({
  entry,
  origin,
  closing,
  onRequestClose,
  onClosed,
  onLifted,
  onLanded,
  eyebrow,
  themeClass,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const coverImgRef = useRef<HTMLImageElement>(null)
  const reduced = useReducedMotion()
  // Vị trí tấm ảnh lúc mở — dùng lại khi đóng (tấm ảnh thật đang ẩn, rect vẫn đúng)
  const start = useRef<ReturnType<typeof fromPrint> | null>(null)

  // Mở
  useGSAP(
    () => {
      const panel = panelRef.current!
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
        // Vừa nhấc lên khỏi bàn → sóng lan ra từ chỗ tấm ảnh vừa rời đi
        .call(() => onLifted?.(), [], 0.05)
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
      if (reduced || !origin || !start.current) {
        gsap.to(panel, { opacity: 0, duration: reduced ? 0 : 0.2, onComplete: onClosed })
        return
      }
      gsap
        .timeline({ onComplete: onClosed })
        .to('[data-body]', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
        .to('[data-cover]', { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0.05)
        .to(panel, {
          ...start.current,
          duration: 0.6,
          ease: 'power3.inOut',
          onUpdate: () => keepPhotoRatio(panel, coverImgRef.current),
        }, 0.2)
        // Phát sóng khi tấm ảnh đi được ~75% quãng thu về — lúc này nó đã sát chỗ cũ và đang chậm dần,
        // sóng bắt đầu ngay khi "chạm" nên hai chuyển động gối lên nhau, không có nhịp chờ
        .call(() => onLanded?.(), [], 0.2 + 0.6 * 0.75)
    },
    { scope: rootRef, dependencies: [closing] },
  )

  // Esc, giữ focus trong tờ hồ sơ, khóa cuộn nền (bù độ rộng thanh cuộn để trang không giật)
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
        onRequestClose()
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
    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
    }
  }, [onRequestClose])

  const titleId = `archive-title-${entry.id}`

  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-8">
      {/* Lớp trong suốt — nền trang không đổi màu, chỉ để bấm ra ngoài thì đóng */}
      <div aria-hidden onClick={onRequestClose} className="absolute inset-0" />

      {/* Tờ hồ sơ: cùng chất liệu với tấm ảnh trên bàn (giấy ngà, viền răng cưa) */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${themeClass} stamp-edge relative flex max-h-[88svh] w-full flex-col bg-wm-ivory p-[7px] text-wm-charcoal will-change-transform md:max-h-[84svh] md:max-w-5xl`}
      >
        {/* Ảnh phủ kín tờ hồ sơ trong lúc bay — để thấy chính tấm ảnh được phóng to */}
        <div data-cover aria-hidden className="pointer-events-none absolute inset-[7px] z-10 overflow-hidden bg-wm-stone">
          <img
            ref={coverImgRef}
            src={photoUrl(entry.photo.id, 1400)}
            srcSet={photoSrcSet(entry.photo.id)}
            sizes="(min-width: 768px) 64rem, 100vw"
            alt=""
            className="h-full w-full object-cover saturate-[.7]"
          />
        </div>

        <div data-body className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-page-line px-6 py-4 md:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">
              {eyebrow} :: {entry.number}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onRequestClose}
              aria-label="Đóng"
              className={`grid h-10 w-10 place-items-center rounded-full border border-page-line transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-8 px-6 py-8 md:grid-cols-12 md:gap-10 md:px-8 md:py-10">
              <div className="md:col-span-4">
                <div className="overflow-hidden rounded-control bg-wm-stone md:sticky md:top-0">
                  <img
                    src={photoUrl(entry.photo.id, 800)}
                    srcSet={photoSrcSet(entry.photo.id)}
                    sizes="(min-width: 768px) 30vw, 90vw"
                    alt={entry.photo.alt}
                    className="aspect-[16/10] w-full object-cover saturate-[.7] md:aspect-[4/5]"
                  />
                </div>
              </div>
              <div className="md:col-span-8">
                <h2 id={titleId} className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl">
                  {entry.title}
                </h2>
                <div className="mt-6">{entry.content}</div>
                {entry.actions && (
                  <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-page-line pt-6">
                    {entry.actions}
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
