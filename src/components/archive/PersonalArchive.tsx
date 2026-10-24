import { useCallback, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'
import ArchiveItem from './ArchiveItem'
import ArchiveDetail from './ArchiveDetail'
import DeskRipple, { type DeskRippleHandle } from './DeskRipple'
import type { ArchiveEntry } from './types'
import { FOCUS } from '@utils/focus'

/**
 * Vị trí từng tấm ảnh trên "mặt bàn" (desktop lg+: lưới 12 cột, lệch có chủ đích;
 * md: 2 cột so le; mobile: một cột). Nhịp: lớn trái → nhỏ phải thấp hơn → … để mắt đi zíc-zắc.
 * `speed` = độ trôi parallax (yPercent) khi cuộn, âm = trôi lên nhanh hơn.
 */
const SLOTS = [
  { cls: 'lg:col-start-1 lg:col-span-5', tilt: -2, aspect: 'aspect-[4/5]', speed: -6 },
  { cls: 'lg:col-start-7 lg:col-span-4 md:mt-24 lg:mt-36', tilt: 2.2, aspect: 'aspect-[4/3]', speed: 4 },
  { cls: 'lg:col-start-3 lg:col-span-4 lg:-mt-6', tilt: 1.2, aspect: 'aspect-square', speed: -3 },
  { cls: 'lg:col-start-8 lg:col-span-5 md:mt-24 lg:mt-28', tilt: -1.6, aspect: 'aspect-[3/2]', speed: 5 },
  { cls: 'lg:col-start-1 lg:col-span-4 lg:mt-10', tilt: -1, aspect: 'aspect-[3/4]', speed: -4 },
  { cls: 'lg:col-start-6 lg:col-span-5 md:mt-24 lg:mt-32', tilt: 1.8, aspect: 'aspect-[4/3]', speed: 3 },
] as const

type Props = {
  entries: ArchiveEntry[]
  /** Tên vùng cho trình đọc màn hình */
  label: string
  /** Nhãn nhỏ trên tấm hồ sơ khi mở */
  eyebrow: string
  themeClass?: string
  /** Lời ngỏ phía trên các tấm ảnh */
  intro?: ReactNode
}

/**
 * Không gian hồ sơ: các tấm ảnh tượng trưng đặt trên mặt bàn, bấm để mở nội dung.
 * Chỉ một tấm hồ sơ mở tại một thời điểm; đóng xong mới gỡ, focus trả về tấm ảnh.
 */
export default function PersonalArchive({ entries, label, eyebrow, themeClass = 'theme-ivory', intro }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const rippleRef = useRef<DeskRippleHandle>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const reduced = useReducedMotion()
  // Kéo thả chỉ trên màn hình lớn có chuột: cảm ứng cần cuộn tự nhiên, màn nhỏ không đủ chỗ bày
  const wide = useMediaQuery('(min-width: 1024px)')
  const finePointer = useMediaQuery(FINE_POINTER)
  const canDrag = wide && finePointer
  const topZ = useRef(1)
  const [moved, setMoved] = useState(false)

  // Hiện dần khi cuộn tới + parallax nhẹ (desktop). Tắt hẳn khi "giảm chuyển động".
  useGSAP(
    () => {
      if (reduced) return
      const items = gsap.utils.toArray<HTMLElement>('[data-archive-item]')
      items.forEach((el, i) => {
        gsap.from(el, {
          y: 56,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          delay: (i % 2) * 0.12,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        })
      })
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        items.forEach((el) => {
          const speed = Number(el.dataset.speed ?? 0)
          gsap.to(el.querySelector('[data-parallax]'), {
            yPercent: speed,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        })
      })
    },
    { scope: rootRef, dependencies: [entries.length, reduced] },
  )

  const active = entries.find((e) => e.id === activeId) ?? null

  // Đang mở một tấm → các tấm khác lùi về sau (nhỏ lại, mờ đi); đóng → trở lại.
  // Nền trang giữ nguyên màu — chiều sâu đến từ chuyển động của chính các tấm ảnh.
  useGSAP(
    () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-archive-item]')
      const back = activeId !== null && !closing
      items.forEach((li) => {
        if (li.dataset.id === activeId) return
        gsap.to(li.querySelector('[data-recede]'), {
          scale: back ? 0.9 : 1,
          opacity: back ? 0.35 : 1,
          duration: reduced ? 0 : back ? 0.7 : 0.6,
          ease: 'power3.inOut',
          overwrite: 'auto',
        })
      })
    },
    { scope: rootRef, dependencies: [activeId, closing, reduced] },
  )

  /** Tấm đang kéo nằm trên cùng, như nhặt lên khỏi mặt bàn */
  const lift = (li: HTMLElement | null) => {
    if (li) li.style.zIndex = String(++topZ.current)
    setMoved(true)
  }

  /** Đưa mọi tấm về chỗ ban đầu */
  const tidy = () => {
    gsap.to(rootRef.current?.querySelectorAll('[data-drag]') ?? [], {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: 'power3.inOut',
      stagger: 0.04,
    })
    setMoved(false)
  }

  const open = (id: string) => {
    if (activeId) return // đang mở/đóng một tấm khác — không chồng tấm
    setClosing(false)
    setActiveId(id)
  }
  const requestClose = useCallback(() => setClosing(true), [])
  const onClosed = useCallback(() => {
    const id = activeId
    setActiveId(null)
    setClosing(false)
    // Chờ tấm ảnh hiện lại (đang `invisible` thì không nhận focus) rồi mới trả focus
    if (id) requestAnimationFrame(() => itemRefs.current.get(id)?.focus({ preventScroll: true }))
  }, [activeId])

  /** Tấm ảnh vừa chạm lại mặt bàn → vòng sóng hạt lan ra từ tâm nó (như video tham khảo p3) */
  const onLanded = useCallback(() => {
    const item = activeId ? itemRefs.current.get(activeId) : null
    if (!item || reduced) return
    const r = (item.querySelector('[data-print]') ?? item).getBoundingClientRect()
    rippleRef.current?.play(r.left + r.width / 2, r.top + r.height / 2)
  }, [activeId, reduced])

  return (
    <section ref={rootRef} aria-label={label} className="shell relative pb-section">
      <DeskRipple ref={rippleRef} />
      {intro}
      {/* Chỉ hiện sau khi đã kéo — đưa các tấm về chỗ cũ. Nổi ở góc, không đẩy lưới ảnh */}
      {canDrag && moved && (
        <div className="absolute right-6 top-6 z-20 md:right-10 lg:right-16">
          <button
            type="button"
            onClick={tidy}
            className={`link-underline rounded-control text-sm text-page-muted hover:text-page-fg ${FOCUS}`}
          >
            Xếp lại mặt bàn
          </button>
        </div>
      )}
      <ul className="mt-6 grid gap-14 md:mt-8 md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
        {entries.map((entry, i) => {
          const slot = SLOTS[i % SLOTS.length]
          return (
            <li
              key={entry.id}
              data-archive-item
              data-id={entry.id}
              data-speed={slot.speed}
              className={cn('relative', slot.cls, i % 2 === 1 && 'md:mt-24')}
            >
              <div data-parallax>
                <div data-recede>
                <ArchiveItem
                  ref={(el) => {
                    if (el) itemRefs.current.set(entry.id, el)
                    else itemRefs.current.delete(entry.id)
                  }}
                  entry={entry}
                  tilt={slot.tilt}
                  aspect={slot.aspect}
                  lifted={activeId === entry.id}
                  draggable={canDrag && !reduced}
                  onLift={() => lift(itemRefs.current.get(entry.id)?.closest('li') ?? null)}
                  onOpen={() => open(entry.id)}
                />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {active && (
        <ArchiveDetail
          key={active.id}
          entry={active}
          origin={itemRefs.current.get(active.id) ?? null}
          closing={closing}
          onRequestClose={requestClose}
          onClosed={onClosed}
          onLanded={onLanded}
          eyebrow={eyebrow}
          themeClass={themeClass}
        />
      )}
    </section>
  )
}
