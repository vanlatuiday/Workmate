import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { gsap, useGSAP } from '@utils/gsap'
import type { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToY } from '@hooks/useSmoothScroll'
import { useCurtainNavigate } from '@components/motion/PageCurtain'
import { cn } from '@utils/cn'
import TiltFrame from './TiltFrame'
import { pad, photoUrl, type GalleryItem } from './types'
import type { GalleryProps } from './DiscoverGallery'
import { FOCUS_FAR } from '@utils/focus'

/** Quãng cuộn cho mỗi ảnh (vh) */
const STEP_VH = 80
/** Phần đầu/cuối mỗi quãng mà ảnh đứng yên ở giữa — cảm giác "dừng lại ngắm" */
const HOLD = 0.18
/** Ngừng cuộn bao lâu (ms) thì tự trôi về ảnh gần nhất */
const SNAP_IDLE = 160
const EASE = [0.22, 1, 0.36, 1] as const


/** Tiến trình thô → tiến trình có đoạn nghỉ quanh mỗi số nguyên (smoothstep ở giữa). */
function settle(p: number) {
  const i = Math.floor(p)
  const t = Math.min(1, Math.max(0, (p - i - HOLD) / (1 - 2 * HOLD)))
  return i + t * t * (3 - 2 * t)
}

/**
 * Bộ sưu tập ảnh điều khiển bằng cuộn (desktop, không "giảm chuyển động").
 *
 * Khung cao N quãng cuộn, bên trong là một lớp `sticky` cao bằng màn hình.
 * ScrollTrigger (scrub — có quán tính) đẩy tiến trình `p` từ 0 → N-1; mỗi ảnh đặt
 * theo khoảng cách `d = i - p` tới vị trí giữa: ảnh sau nằm dưới-trái, ảnh trước
 * trôi lên-phải, nhỏ và nghiêng dần. Chỉ ghi transform/opacity, không gây reflow.
 * Chữ hai bên đổi theo ảnh đang ở giữa (`active`).
 */
export default function ScrollGallery<T extends GalleryItem>({ items, label, intro, renderDetail, layout = 'default' }: GalleryProps<T>) {
  const n = items.length
  const sectionRef = useRef<HTMLElement>(null)
  const frames = useRef<(HTMLAnchorElement | null)[]>([])
  /** Chỉ bố cục "jobs": thẻ kính bên phải + phần chữ trong thẻ */
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const contents = useRef<(HTMLDivElement | null)[]>([])
  /** Vệt sáng hắt xuống nền dưới ảnh đang xem (bố cục "jobs") */
  const glows = useRef<(HTMLImageElement | null)[]>([])
  /** Đường tiến trình cạnh mục lục (bố cục "jobs") */
  const listRef = useRef<HTMLOListElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const centers = useRef<number[]>([])
  const lastP = useRef(0)

  /** Đo tâm từng mục (so với <ol>) — đường chạy từ tâm mục đầu đến tâm mục cuối */
  const measureLine = () => {
    const list = listRef.current
    const track = trackRef.current
    if (!list || !track) return
    // Chỉ lấy <li> (bỏ qua chính vạch đường nằm trong <ol>)
    centers.current = [...list.querySelectorAll<HTMLLIElement>(':scope > li')].map(
      (li) => li.offsetTop + li.offsetHeight / 2,
    )
    const c = centers.current
    track.style.top = `${c[0]}px`
    track.style.height = `${c[c.length - 1] - c[0]}px`
  }
  /** Phần đậm dài tới đúng vị trí cuộn: nội suy giữa tâm hai mục kề nhau; chỉ ghi transform */
  const paintLine = (p: number) => {
    lastP.current = p
    const c = centers.current
    const fill = fillRef.current
    if (!fill || c.length < 2) return
    const i = Math.min(c.length - 2, Math.max(0, Math.floor(p)))
    const t = Math.min(1, Math.max(0, p - i))
    const y = c[i] + (c[i + 1] - c[i]) * t - c[0]
    fill.style.transform = `scaleY(${y / (c[c.length - 1] - c[0])})`
  }
  const stRef = useRef<ScrollTrigger | null>(null)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const go = useCurtainNavigate()

  const { contextSafe } = useGSAP(
    () => {
      const dims = { w: 0, h: 0, card: 0, shift: 0 }
      const measure = () => {
        const f = frames.current[0]
        if (f) dims.w = f.offsetWidth
        if (f) dims.h = f.offsetHeight
        // Thẻ chữ thấp hơn ảnh (≈80%) để ảnh luôn là khối lớn nhất; bước dời giống ảnh (×1.08)
        if (layout === 'jobs' && dims.h) {
          const cardH = Math.round(dims.h * 0.8)
          cards.current.forEach((c) => c && (c.style.height = `${cardH}px`))
          dims.card = cardH * 1.08
          // Khoảng trống phía trên ảnh khi ảnh căn giữa sân khấu (màn cao → trống nhiều)
          const stage = f?.parentElement
          dims.shift = stage ? Math.max(0, (stage.offsetHeight - dims.h) / 2 - 16) : 0
        }
      }
      const state = { p: 0 }

      const render = () => {
        const p = settle(state.p)
        paintLine(p)
        // Bố cục "jobs": ở ảnh đầu, ảnh + thẻ được kéo lên sát thanh tìm kiếm (bỏ khoảng trống
        // do căn giữa); cuộn sang ảnh thứ hai thì trôi dần về giữa để ảnh trước/sau ló ra hai đầu.
        const lift = -dims.shift * Math.max(0, 1 - p)
        frames.current.forEach((el, i) => {
          if (!el) return
          const d = i - p
          const ad = Math.abs(d)
          const scale = 1 - Math.min(ad, 2) * 0.17
          el.style.transform =
            `translate3d(${-d * dims.w * 0.18}px, ${d * dims.h * 1.08 + lift}px, 0) ` +
            `perspective(1400px) rotateX(${d * 10}deg) rotateZ(${-d * 4}deg) scale(${scale})`
          const fade = ad <= 1.25 ? 1 : Math.max(0, 1 - (ad - 1.25) * 1.6)
          // Bố cục "jobs": ảnh trên/dưới mờ đi (còn 35%), rõ dần khi cuộn vào giữa
          const dim = layout === 'jobs' ? 1 - Math.min(ad, 1) * 0.65 : 1
          el.style.opacity = String(fade * dim)
          el.style.zIndex = String(100 - Math.round(ad * 10))
          el.style.visibility = ad > 2.2 ? 'hidden' : 'visible'
        })
        // Vệt sáng: chỉ ảnh ở giữa hắt màu xuống nền, mờ dần khi ảnh rời đi
        glows.current.forEach((el, i) => {
          if (el) el.style.opacity = String(Math.max(0, 1 - Math.abs(i - p) * 1.6) * 0.55)
        })
        cards.current.forEach((el, i) => {
          if (!el) return
          const d = i - p
          const ad = Math.abs(d)
          // Nghiêng và nhỏ dần giống ảnh; thẻ ở giữa (d = 0) đứng thẳng
          const scale = 1 - Math.min(ad, 2) * 0.17
          el.style.transform =
            `translate3d(0, ${d * dims.card + lift}px, 0) ` +
            `perspective(1400px) rotateX(${d * 10}deg) rotateZ(${-d * 4}deg) scale(${scale})`
          el.style.visibility = ad > 1.6 ? 'hidden' : 'visible'
          // Thẻ không ở giữa: không nhận chuột/bàn phím, ẩn khỏi trình đọc màn hình
          const isCenter = ad < 0.5
          el.toggleAttribute('inert', !isCenter)
          el.setAttribute('aria-hidden', String(!isCenter))
          const content = contents.current[i]
          if (content) content.style.opacity = String(Math.max(0, 1 - ad * 2.5))
        })
        const idx = Math.min(n - 1, Math.max(0, Math.round(p)))
        if (idx !== activeRef.current) {
          activeRef.current = idx
          setActive(idx)
        }
      }

      measure()
      render()
      if (n < 2) return

      // Dừng cuộn giữa hai ảnh → trôi nhẹ về ảnh gần nhất. Lenis vẫn phát sự kiện cuộn
      // trong lúc trôi quán tính, nên chỉ chốt khi đã đứng yên hẳn.
      let snapTimer = 0
      const scheduleSnap = (self: ScrollTrigger) => {
        window.clearTimeout(snapTimer)
        snapTimer = window.setTimeout(() => {
          if (!self.isActive) return
          const raw = self.progress * (n - 1)
          const target = Math.round(raw)
          if (Math.abs(raw - target) < 0.02) return
          scrollToY(self.start + (target / (n - 1)) * (self.end - self.start), true)
        }, SNAP_IDLE)
      }

      const tween = gsap.to(state, {
        p: n - 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 64px', // ngay dưới header (h-16)
          end: 'bottom bottom',
          scrub: 0.9,
          onUpdate: scheduleSnap,
          onRefresh: () => {
            measure()
            render()
          },
        },
      })
      stRef.current = tween.scrollTrigger ?? null
      return () => {
        window.clearTimeout(snapTimer)
        stRef.current = null
      }
    },
    { scope: sectionRef, dependencies: [n] },
  )

  // Mục đang xem chữ to hơn → vị trí các mục đổi; đo lại rồi vẽ lại đường
  useEffect(() => {
    if (layout !== 'jobs') return
    const redo = () => {
      measureLine()
      paintLine(lastP.current)
    }
    redo()
    document.fonts?.ready.then(redo)
    window.addEventListener('resize', redo)
    return () => window.removeEventListener('resize', redo)
  }, [active, layout, n])

  /** Cuộn tới vị trí mà ảnh `i` nằm giữa. */
  const jumpTo = (i: number) => {
    const st = stRef.current
    if (!st || n < 2) return
    const idx = Math.min(n - 1, Math.max(0, i))
    scrollToY(st.start + (idx / (n - 1)) * (st.end - st.start), true)
  }

  const onFrameClick = contextSafe((e: MouseEvent<HTMLAnchorElement>, i: number) => {
    // Ảnh bên cạnh: bấm để kéo nó vào giữa, chưa mở trang
    if (i !== activeRef.current) {
      e.preventDefault()
      jumpTo(i)
      return
    }
    // Ctrl/Cmd/Shift + bấm → để trình duyệt mở tab mới như link thường
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    const el = frames.current[i]
    const others = frames.current.filter((f, k) => f && k !== i)
    gsap.to(others, { opacity: 0, duration: 0.3, ease: 'power2.out' })
    gsap.to(el?.querySelector('img') ?? [], { scale: 1.12, duration: 0.5, ease: 'power3.out', overwrite: true })
    go(items[i].href, items[i].title, { from: '/viec-lam' })
  })

  const current = items[active]
  const jobs = layout === 'jobs'

  if (jobs) {
    return (
      <section
        ref={sectionRef}
        aria-label={label}
        className="relative isolate"
        style={{ height: `calc(100svh - 4rem + ${(n - 1) * STEP_VH}vh)` }}
      >
        <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
          {/* Ba cột: mục lục gọn · sân khấu ảnh · thẻ kính riêng bên phải (không đè lên ảnh) */}
          <div className="shell grid h-full grid-cols-[minmax(13rem,18%)_1fr_minmax(19rem,25%)] gap-8 pb-8 pt-6">
            <div className="relative z-[110] flex min-h-0 flex-col justify-between">
              {/* Mục lục cho chuột; bàn phím dùng hai nút bên dưới nên ẩn khỏi trình đọc màn hình */}
              {/* Đường tiến trình (A): vạch nhạt dọc theo mục lục, phần đậm dài dần theo cuộn.
                  Chỉ có ở bản cuộn; người bật "giảm chuyển động" dùng StaticGallery nên không có hiệu ứng này. */}
              <ol ref={listRef} aria-hidden className="relative space-y-2 pl-4">
                <span ref={trackRef} aria-hidden className="absolute left-0 w-px overflow-hidden bg-page-line">
                  <span ref={fillRef} className="absolute inset-0 origin-top scale-y-0 bg-page-fg will-change-transform" />
                </span>
                {items.map((item, i) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => jumpTo(i)}
                      className={cn(
                        'flex w-full items-baseline gap-3 text-left leading-snug transition-colors duration-300',
                        i === active
                          ? 'font-display text-lg font-semibold text-page-fg'
                          : i < active
                            ? 'text-sm text-page-fg' // đã đi qua: đậm lên
                            : 'text-sm text-page-muted hover:text-page-fg',
                      )}
                    >
                      <span className="tnum w-5 shrink-0 text-xs text-page-muted">{pad(i + 1)}</span>
                      <span className="line-clamp-2">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="flex items-end gap-4">
                <div className="flex items-end gap-2">
                  <span className="relative block h-[1.06em] overflow-hidden font-display text-display-sm font-semibold leading-[1.06] tnum">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={active}
                        className="block"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.5, ease: EASE }}
                      >
                        {pad(active + 1)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="pb-1.5 text-sm text-page-muted tnum">/ {pad(n)}</span>
                </div>
                <div className="flex gap-2 pb-1">
                  <StepButton label="Mục trước" disabled={active === 0} onClick={() => jumpTo(active - 1)}>
                    <ArrowUp className="h-4 w-4" />
                  </StepButton>
                  <StepButton label="Mục sau" disabled={active === n - 1} onClick={() => jumpTo(active + 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </StepButton>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Sân khấu ảnh — ảnh căn giữa cột giữa, JS dời từng ảnh như bản mặc định */}
              <div className="absolute inset-0 grid place-items-center">
                {items.map((item, i) => (
                  <Link
                    key={item.id}
                    ref={(el) => {
                      frames.current[i] = el
                    }}
                    to={item.href}
                    state={{ from: '/viec-lam' }}
                    tabIndex={i === active ? 0 : -1}
                    aria-label={item.linkLabel}
                    data-cursor={i === active ? item.cursor : undefined}
                    onClick={(e) => onFrameClick(e, i)}
                    className={cn(
                      'relative col-start-1 row-start-1 block aspect-[4/3] rounded-control will-change-transform',
                      'w-[min(100%,calc((100svh_-_11rem)*4/3))]',
                      FOCUS_FAR,
                    )}
                  >
                    {/* Bản ảnh cỡ nhỏ (160px), nhòe mạnh, nằm sau và lệch xuống dưới ảnh → như ánh màu
                        của chính ảnh hắt lên nền. Chỉ đổi opacity theo cuộn; blur là tĩnh. */}
                    <img
                      ref={(el) => {
                        glows.current[i] = el
                      }}
                      src={photoUrl(item.photo.id, 160)}
                      alt=""
                      aria-hidden
                      loading={i < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable={false}
                      className="pointer-events-none absolute inset-x-[8%] top-[18%] -z-10 h-[92%] w-[84%] object-cover opacity-0 blur-[56px] saturate-150"
                    />
                    <TiltFrame photo={item.photo} active={i === active} eager={i < 3} sizes="44vw" />
                  </Link>
                ))}
              </div>

            </div>

            {/* Cột phải: chồng thẻ kính, mỗi ảnh một thẻ, trôi thẳng đứng cùng nhịp với ảnh (JS).
                Chỉ thẻ ở giữa hiện chữ; chữ rõ dần khi thẻ tiến vào giữa, mờ đi khi rời đi. */}
            <div className="relative z-[110] grid min-h-0 place-items-center">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    cards.current[i] = el
                  }}
                  data-lenis-prevent
                  className="glass-liquid col-start-1 row-start-1 w-full overflow-y-auto overscroll-contain rounded-card p-5 text-page-fg will-change-transform [--glass-alpha:72%] [scrollbar-width:thin]"
                >
                  <div
                    ref={(el) => {
                      contents.current[i] = el
                    }}
                  >
                    {renderDetail(item)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      aria-label={label}
      className="relative isolate"
      style={{ height: `calc(100svh - 4rem + ${(n - 1) * STEP_VH}vh)` }}
    >
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        {/* Ba cột: chữ trái · ảnh giữa · chữ phải. Cột chữ z cao hơn ảnh để ảnh bên cạnh trôi qua bên dưới */}
        <div className="shell grid h-full grid-cols-[18%_1fr_24%] gap-8 py-10">
          <div className="relative z-[110] flex min-h-0 flex-col justify-between">
            <div>{intro}</div>

            <div>
              <div className="flex items-end gap-3">
                <span className="relative block h-[1.06em] overflow-hidden font-display text-display-sm font-semibold leading-[1.06] tnum">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={active}
                      className="block"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '-100%' }}
                      transition={{ duration: 0.5, ease: EASE }}
                    >
                      {pad(active + 1)}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="pb-2 text-sm text-page-muted tnum">/ {pad(n)}</span>
              </div>

              <div className="mt-5 flex gap-2">
                <StepButton label="Mục trước" disabled={active === 0} onClick={() => jumpTo(active - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </StepButton>
                <StepButton label="Mục sau" disabled={active === n - 1} onClick={() => jumpTo(active + 1)}>
                  <ArrowDown className="h-4 w-4" />
                </StepButton>
              </div>

              {/* Mục lục cho chuột; bàn phím dùng hai nút trên nên ẩn khỏi trình đọc màn hình */}
              <ol aria-hidden className="mt-8 space-y-1.5 text-sm">
                {items.map((item, i) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => jumpTo(i)}
                      className={cn(
                        'flex w-full gap-3 text-left transition-opacity duration-300',
                        i === active ? 'opacity-100' : 'opacity-40 hover:opacity-80',
                      )}
                    >
                      <span className="tnum text-page-muted">{pad(i + 1)}</span>
                      <span className="truncate">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative">
            {/* Sân khấu ảnh — mọi ảnh chồng cùng một ô lưới ở giữa, JS dời từng ảnh */}
            <div className="absolute inset-0 grid place-items-center">
              {items.map((item, i) => (
                <Link
                  key={item.id}
                  ref={(el) => {
                    frames.current[i] = el
                  }}
                  to={item.href}
                  state={{ from: '/viec-lam' }}
                  tabIndex={i === active ? 0 : -1}
                  aria-label={item.linkLabel}
                  data-cursor={i === active ? item.cursor : undefined}
                  onClick={(e) => onFrameClick(e, i)}
                  className={cn(
                    'col-start-1 row-start-1 block aspect-[4/3] rounded-control will-change-transform',
                    'w-[min(38vw,calc((100svh_-_14rem)*4/3))]',
                    FOCUS_FAR,
                  )}
                >
                  <TiltFrame photo={item.photo} active={i === active} eager={i < 3} sizes="38vw" />
                </Link>
              ))}
            </div>
          </div>

          <div className="relative z-[110] self-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {renderDetail(current)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border border-page-line transition-colors duration-300',
        'hover:border-page-fg disabled:pointer-events-none disabled:opacity-30',
        FOCUS_FAR,
      )}
    >
      {children}
    </button>
  )
}
