import { useEffect, useRef, useState, type ReactNode } from 'react'
import { gsap } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useExperienceStore } from '@context/experienceStore'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { cn } from '@utils/cn'
import { FOCUS_FAR } from '@utils/focus'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { createCurveRenderer, type CardDraw } from './curveGL'

export interface CurvedItem {
  id: string
  photo: Photo
}

type Props<T extends CurvedItem> = {
  items: T[]
  /** Nhãn của danh sách cho trình đọc màn hình */
  label: string
  /** Chữ dưới ảnh (tiêu đề, phụ đề, điểm, mũi tên) */
  renderCaption: (item: T) => ReactNode
  /** Tên đầy đủ của nút cho trình đọc màn hình */
  itemLabel: (item: T) => string
  /** Bấm thẻ; `origin` là nút chứa ảnh (có [data-print]) để khung chi tiết phóng ra từ đó */
  onOpen: (item: T, origin: HTMLElement) => void
  /** Thẻ đang mở chi tiết — không vẽ ảnh của nó trên canvas (tấm ảnh đang "bay") */
  hiddenId?: string | null
}

/** Mức giảm màu lúc nghỉ / khi rê chuột (1 = màu gốc) */
const SAT_IDLE = 0.4
const SAT_HOVER = 1
/** Bo góc ảnh — khớp rounded-card (1rem) */
const ROUND = 16
/** Ảnh nạp cho WebGL: đủ nét ở lưới 2 cột 1440px */
const TEX_WIDTH = 960

/**
 * Lưới 2 cột ảnh lớn; trên desktop ảnh được vẽ lại bằng WebGL để uốn cong ở
 * mép trên/dưới và gợn theo tốc độ cuộn (references/p4.mp4).
 *
 * Thẻ, chữ và nút vẫn là DOM thật (bàn phím, trình đọc màn hình, bấm chuột đi qua DOM);
 * canvas cố định phủ khung nhìn, không nhận chuột, chỉ vẽ phần ảnh. Ảnh DOM chỉ ẩn đi
 * khi texture tương ứng đã sẵn sàng, nên WebGL lỗi/không có thì vẫn thấy lưới ảnh tĩnh.
 * Màn nhỏ, "giảm chuyển động" hoặc chất lượng thấp → lưới tĩnh.
 *
 * Cần Lenis đang chạy (useSmoothScroll) để canvas và DOM cùng một vị trí cuộn mỗi khung hình.
 */
export default function CurvedGallery<T extends CurvedItem>({ items, label, renderCaption, itemLabel, onOpen, hiddenId }: Props<T>) {
  const listRef = useRef<HTMLUListElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const quality = useExperienceStore((s) => s.quality)
  // Vừa chuyển trang tới: đợi trang trượt vào xong mới khởi động WebGL (khởi tạo + nạp ảnh
  // lên GPU nặng, làm hiệu ứng chuyển trang giật). Trong lúc chờ vẫn là ảnh DOM tĩnh.
  const enterDelay = usePageEnterDelay()
  const [settled, setSettled] = useState(enterDelay === 0)
  useEffect(() => {
    if (settled) return
    const id = window.setTimeout(() => setSettled(true), (enterDelay + 0.75) * 1000)
    return () => window.clearTimeout(id)
  }, [settled, enterDelay])
  const enabled = desktop && !reduced && quality === 'high' && settled

  // hiddenId đọc trong vòng vẽ qua ref, không khởi tạo lại WebGL
  const hiddenRef = useRef(hiddenId)
  hiddenRef.current = hiddenId

  // Khóa theo danh sách ảnh: lọc/sắp xếp làm đổi thứ tự thẻ → đọc lại DOM, texture dùng lại
  const itemsKey = items.map((i) => i.id).join(',')

  useEffect(() => {
    const canvas = canvasRef.current
    const list = listRef.current
    if (!enabled || !canvas || !list) return
    const renderer = createCurveRenderer(canvas)
    if (!renderer) return

    type Card = {
      el: HTMLElement
      /** Khung ảnh [data-print] — vị trí vẽ trên canvas */
      frame: HTMLElement
      img: HTMLImageElement | null
      caption: HTMLElement | null
      id: string
      tex?: WebGLTexture
      aspect: number
      sat: number
      zoom: number
    }
    const texById = new Map<string, { tex: WebGLTexture; aspect: number }>()
    let cards: Card[] = []

    const collect = () => {
      cards = [...list.querySelectorAll<HTMLElement>('[data-curve-card]')].map((el) => {
        const id = el.dataset.curveCard!
        const known = texById.get(id)
        return {
          el,
          frame: el.querySelector<HTMLElement>('[data-print]') ?? el,
          img: el.querySelector('img'),
          caption: el.querySelector<HTMLElement>('[data-curve-caption]'),
          id,
          tex: known?.tex,
          aspect: known?.aspect ?? 1,
          sat: SAT_IDLE,
          zoom: 1,
        }
      })
      cards.forEach((c) => {
        if (c.tex) handOver(c)
        else load(c)
      })
    }

    // Texture đã sẵn → ẩn ảnh DOM và nền giữ chỗ của khung (nếu không, ô xám phẳng
    // còn nằm đúng chỗ cũ trong lúc ảnh WebGL đã cuộn ra sau)
    const handOver = (c: Card) => {
      if (c.img) c.img.style.opacity = '0'
      if (c.frame) c.frame.style.backgroundColor = 'transparent'
    }

    // Ảnh nạp riêng có crossOrigin (ảnh DOM không có) — Unsplash trả CORS cho mọi ảnh
    const loading = new Set<string>()
    const load = (c: Card) => {
      if (loading.has(c.id) || texById.has(c.id)) return
      loading.add(c.id)
      const photoId = c.el.dataset.photo!
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.onload = () => {
        if (!destroyed) uploads.push({ id: c.id, img })
      }
      img.src = photoUrl(photoId, TEX_WIDTH)
    }

    // Đưa ảnh lên GPU mỗi khung hình một tấm — dồn cả loạt vào một khung sẽ làm khựng
    const uploads: { id: string; img: HTMLImageElement }[] = []
    const uploadNext = () => {
      const next = uploads.shift()
      if (!next) return
      const entry = { tex: renderer.upload(next.img), aspect: next.img.naturalWidth / next.img.naturalHeight }
      texById.set(next.id, entry)
      cards.filter((x) => x.id === next.id).forEach((x) => {
        x.tex = entry.tex
        x.aspect = entry.aspect
        handOver(x)
      })
    }

    let width = 0
    let height = 0
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, 1.5))
    }
    resize()
    window.addEventListener('resize', resize)

    // Vận tốc cuộn: px/khung quy về -1..1, làm mượt để trống lăn co giãn êm
    let lastY = window.scrollY
    let vel = 0
    const start = performance.now()

    const tick = () => {
      uploadNext()
      const y = window.scrollY
      const raw = Math.max(-1, Math.min(1, (y - lastY) / 60))
      lastY = y
      vel += (raw - vel) * 0.12

      // Đường uốn trên cách header (h-16) một khoảng để dải cong lộ ra dưới header
      // (dải cao bằng bán kính trống); dưới sát đáy màn hình
      const top = 64 + height * 0.2
      const bottom = height - height * 0.05
      const radius = height * (0.22 - Math.abs(vel) * 0.08)

      const draws: CardDraw[] = []
      for (const c of cards) {
        const rect = c.frame.getBoundingClientRect()
        // Chữ dưới ảnh mờ dần khi trôi qua đường uốn trên (ảnh đã cuộn ra sau)
        if (c.caption) {
          const ct = c.caption.getBoundingClientRect().top
          c.caption.style.opacity = String(Math.max(0, Math.min(1, 1 - (top - ct) / 90)))
        }
        if (!c.tex || c.id === hiddenRef.current) continue
        if (rect.bottom < -height * 0.2 || rect.top > height * 1.2) continue
        const active = c.el.matches(':hover') || c.el.matches(':focus-within')
        c.sat += ((active ? SAT_HOVER : SAT_IDLE) - c.sat) * 0.1
        c.zoom += ((active ? 1.04 : 1) - c.zoom) * 0.1
        draws.push({ rect, tex: c.tex, texAspect: c.aspect, sat: c.sat, zoom: c.zoom })
      }
      renderer.draw(draws, {
        width,
        height,
        edges: [top, bottom],
        radius,
        vel,
        time: (performance.now() - start) / 1000,
        round: ROUND,
      })
    }

    let destroyed = false
    collect()
    // Gắn vào ticker sau Lenis (Lenis được thêm trong effect của trang cha, chạy sau effect này)
    // để đọc vị trí cuộn đã cập nhật trong cùng khung hình — ảnh không trễ so với chữ.
    const raf = requestAnimationFrame(() => {
      if (!destroyed) gsap.ticker.add(tick)
    })

    const onLost = (e: Event) => {
      e.preventDefault()
      cleanup()
    }
    canvas.addEventListener('webglcontextlost', onLost)

    function cleanup() {
      if (destroyed) return
      destroyed = true
      cancelAnimationFrame(raf)
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', resize)
      canvas?.removeEventListener('webglcontextlost', onLost)
      cards.forEach((c) => {
        if (c.img) c.img.style.opacity = ''
        c.frame.style.backgroundColor = ''
        if (c.caption) c.caption.style.opacity = ''
      })
      renderer?.clear()
      renderer?.destroy()
    }
    return cleanup
  }, [enabled, itemsKey])

  return (
    <>
      <ul ref={listRef} aria-label={label} className="grid gap-x-6 gap-y-12 lg:grid-cols-2 lg:gap-y-16">
        {items.map((item) => (
          <li key={item.id} data-curve-card={item.id} data-photo={item.photo.id}>
            <button
              type="button"
              aria-label={itemLabel(item)}
              onClick={(e) => onOpen(item, e.currentTarget)}
              className={cn('group block w-full rounded-card text-left', FOCUS_FAR)}
            >
              <div data-print className="relative aspect-[16/10] overflow-hidden rounded-card bg-page-surface">
                <img
                  src={photoUrl(item.photo.id, 960)}
                  srcSet={photoSrcSet(item.photo.id)}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  alt={item.photo.alt}
                  loading="lazy"
                  className={cn(
                    'h-full w-full object-cover saturate-[.55] sepia-[.12]',
                    'transition-[filter,transform] duration-500 ease-editorial group-hover:scale-[1.04] group-hover:saturate-100 group-hover:sepia-0',
                    'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                    hiddenId === item.id && 'invisible',
                  )}
                />
              </div>
              <div data-curve-caption className="mt-4">
                {renderCaption(item)}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {enabled && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-30 h-screen w-screen"
        />
      )}
    </>
  )
}
