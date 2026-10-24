import { useCallback, useRef, useState, type ReactNode } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import ArchiveItem from './ArchiveItem'
import ArchiveDetail from './ArchiveDetail'
import type { ArchiveEntry } from './types'

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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const reduced = useReducedMotion()

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
    if (id) itemRefs.current.get(id)?.focus({ preventScroll: true })
  }, [activeId])

  return (
    <section ref={rootRef} aria-label={label} className="shell pb-section">
      {intro}
      <ul className="mt-16 grid gap-14 md:mt-20 md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
        {entries.map((entry, i) => {
          const slot = SLOTS[i % SLOTS.length]
          return (
            <li
              key={entry.id}
              data-archive-item
              data-speed={slot.speed}
              className={cn(slot.cls, i % 2 === 1 && 'md:mt-24')}
            >
              <div data-parallax>
                <ArchiveItem
                  ref={(el) => {
                    if (el) itemRefs.current.set(entry.id, el)
                    else itemRefs.current.delete(entry.id)
                  }}
                  entry={entry}
                  tilt={slot.tilt}
                  aspect={slot.aspect}
                  lifted={activeId === entry.id}
                  onOpen={() => open(entry.id)}
                />
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
          eyebrow={eyebrow}
          themeClass={themeClass}
        />
      )}
    </section>
  )
}
