import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import type { ArchiveEntry } from './types'

type Props = {
  entry: ArchiveEntry
  /** Tấm ảnh vừa bấm — tấm hồ sơ nở ra từ vị trí này và thu về đó khi đóng */
  origin: HTMLElement | null
  /** Đổi sang true để bắt đầu đóng (chạy hiệu ứng ngược) */
  closing: boolean
  /** Gọi khi người dùng muốn đóng (nút X, Esc, bấm nền) */
  onRequestClose: () => void
  /** Hiệu ứng đóng chạy xong → gỡ khỏi cây */
  onClosed: () => void
  /** Nhãn nhỏ trên tiêu đề, vd. "Hồ sơ" */
  eyebrow: string
  /** Class theme của trang (portal ra body nên phải mang theo) */
  themeClass: string
}

/** Tấm ảnh in bên trong nút (phần sẽ được nhân bản lên lớp phủ) */
const printOf = (origin: HTMLElement) => origin.querySelector<HTMLElement>('[data-print]') ?? origin

/**
 * Dời/thu `panel` về "nằm dưới tấm ảnh": tâm trùng tâm ảnh (lệch xuống `drop` × chiều cao ảnh),
 * thu nhỏ đều để rộng ~86% tấm ảnh — như tờ thư còn nằm trong phong bì.
 */
function tucked(panel: HTMLElement, origin: HTMLElement, drop = 0) {
  const p = panel.getBoundingClientRect()
  const o = printOf(origin).getBoundingClientRect()
  const scale = (o.width * 0.86) / p.width
  return {
    x: o.left + o.width / 2 - (p.left + p.width / 2),
    y: o.top + o.height / 2 - (p.top + p.height / 2) + o.height * drop,
    scale,
  }
}

/** Nhân bản tấm ảnh in, đặt khít lên vị trí thật của nó trên lớp phủ */
function placeGhost(ghost: HTMLElement, origin: HTMLElement) {
  const print = printOf(origin)
  const r = print.getBoundingClientRect()
  const w = print.offsetWidth
  const h = print.offsetHeight
  ghost.replaceChildren(print.cloneNode(true))
  Object.assign(ghost.style, {
    width: `${w}px`,
    height: `${h}px`,
    left: `${r.left + r.width / 2 - w / 2}px`,
    top: `${r.top + r.height / 2 - h / 2}px`,
  })
}

/** Tờ thư trượt ra khỏi tấm ảnh bao xa (theo chiều cao ảnh) trước khi bay lên giữa */
const DROP = 0.62

/**
 * Tờ hồ sơ mở ra trên trang (không đổi URL) — như rút lá thư khỏi phong bì:
 * 1. tờ giấy nằm sẵn dưới tấm ảnh, trượt xuống lộ ra;
 * 2. bay lên giữa màn hình và mở ra cỡ thật, tấm ảnh mờ dần phía sau; chữ hiện sau cùng.
 * Đóng: chữ mờ, tờ giấy thu nhỏ về dưới tấm ảnh, tấm ảnh hiện lại, tờ giấy trượt vào trong.
 * Trên điện thoại tờ hồ sơ là bottom sheet cuộn được bên trong.
 */
export default function ArchiveDetail({
  entry,
  origin,
  closing,
  onRequestClose,
  onClosed,
  eyebrow,
  themeClass,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()

  // Mở
  useGSAP(
    () => {
      const panel = panelRef.current!
      const ghost = ghostRef.current!
      if (reduced || !origin) {
        gsap.fromTo(['[data-backdrop]', panel], { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : 0.25 })
        return
      }
      placeGhost(ghost, origin)
      // Đo cả hai vị trí khi tờ giấy còn ở kích thước thật — đo sau khi đã thu nhỏ sẽ sai tỉ lệ
      const inside = tucked(panel, origin)
      const out = tucked(panel, origin, DROP)
      gsap.set(panel, inside)
      gsap.set('[data-body]', { opacity: 0 })
      gsap
        .timeline()
        .fromTo('[data-backdrop]', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
        .to(panel, { ...out, duration: 0.45, ease: 'power2.out' }, 0.1)
        .to(panel, { x: 0, y: 0, scale: 1, duration: 0.65, ease: 'power3.inOut' }, 0.55)
        .to(ghost, { opacity: 0, y: -24, scale: 0.94, duration: 0.5, ease: 'power2.in' }, 0.6)
        .to('[data-body]', { opacity: 1, duration: 0.35, ease: 'power2.out' }, 1.05)
    },
    { scope: rootRef },
  )

  // Đóng
  useGSAP(
    () => {
      if (!closing) return
      const panel = panelRef.current!
      const ghost = ghostRef.current!
      if (reduced || !origin) {
        gsap.to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.2, onComplete: onClosed })
        return
      }
      gsap
        .timeline({ onComplete: onClosed })
        .to('[data-body]', { opacity: 0, duration: 0.15, ease: 'power2.in' }, 0)
        .to(panel, { ...tucked(panel, origin, DROP), duration: 0.55, ease: 'power3.inOut' }, 0.1)
        .to(ghost, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }, 0.25)
        .to(panel, { ...tucked(panel, origin), duration: 0.35, ease: 'power2.in' }, 0.65)
        .to('[data-backdrop]', { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.7)
    },
    { scope: rootRef, dependencies: [closing] },
  )

  // Esc, giữ focus trong tấm hồ sơ, khóa cuộn nền (bù độ rộng thanh cuộn để trang không giật)
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
    <div ref={rootRef} className={`${themeClass} fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-8`}>
      {/* Nền tối — bấm để đóng */}
      <div
        data-backdrop
        aria-hidden
        onClick={onRequestClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--wm-charcoal)_62%,transparent)]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-card border border-page-line bg-page-bg text-page-fg will-change-transform md:max-h-[84svh] md:max-w-5xl md:rounded-card"
      >
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
              className="grid h-10 w-10 place-items-center rounded-full border border-page-line transition-colors duration-300 hover:border-page-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-8 px-6 py-8 md:grid-cols-12 md:gap-10 md:px-8 md:py-10">
              <div className="md:col-span-4">
                <div className="overflow-hidden rounded-control bg-page-surface md:sticky md:top-0">
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

      {/* Bản sao tấm ảnh — nằm trên tờ giấy để tờ giấy như được rút ra từ bên dưới */}
      <div ref={ghostRef} aria-hidden className="pointer-events-none fixed" />
    </div>,
    document.body,
  )
}
