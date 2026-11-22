import { Briefcase, LayoutGrid } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { PRESS } from '@utils/ui'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import type { CategoryEntry } from './categoryEntries'

type Props = {
  entries: CategoryEntry[]
  /** Tổng số việc ở thẻ "Tất cả" */
  total: number
  /** Đơn vị đếm trên thẻ: "việc" / "vị trí" */
  unit?: string
  /** Khóa nhóm, hoặc null = "Tất cả" */
  onPick: (key: string | null) => void
}

/**
 * Bộ chọn nhóm công việc ở lần đầu vào /viec-lam: thẻ kính tối cùng kiểu thẻ nhóm của bảng "Ca đang cần người"
 * (ảnh tách nền, biểu tượng tròn, tên, số việc) nhưng bấm là chọn nhóm, không mở danh sách.
 * Markup sao từ ShiftBoardSection (file đó không đổi).
 */
export default function CategoryPicker({ entries, total, unit = 'việc', onPick }: Props) {
  const card =
    'shift-card group/card relative flex h-full w-full flex-col overflow-hidden rounded-card border border-wm-cyan/35 bg-wm-abyss/55 text-left text-wm-ivory backdrop-blur-[16px] hover:border-wm-cyan/70'
  return (
    <div className="shell py-section-sm">
      <ul role="list" aria-label="Nhóm công việc" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        <li>
          <button type="button" onClick={() => onPick(null)} className={cn(card, PRESS, FOCUS)}>
            <span className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b from-wm-ivory/20 to-wm-azure/25">
              <LayoutGrid className="h-14 w-14 text-wm-cyan/80 transition-transform duration-300 motion-safe:group-hover/card:scale-110" aria-hidden />
            </span>
            <Face icon={LayoutGrid} label="Tất cả" count={total} unit={unit} />
          </button>
        </li>
        {entries.map(({ cat, count, photo }) => (
          <li key={cat.key}>
            <button type="button" onClick={() => onPick(cat.key)} className={cn(card, PRESS, FOCUS)}>
              <span className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-b from-wm-ivory/20 to-wm-azure/25">
                <span className="block h-full w-full origin-bottom transition-transform duration-300 ease-out motion-safe:group-hover/card:-translate-y-1.5 motion-safe:group-hover/card:scale-[1.03]">
                  {cat.cutout ? (
                    <img src={cat.cutout.src} alt="" width={800} height={960} loading="lazy" draggable={false} className="h-full w-full object-cover object-center" />
                  ) : photoUrl(photo, 640) ? (
                    <img src={photoUrl(photo, 640)} srcSet={photoSrcSet(photo)} sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw" alt="" width={640} height={800} loading="lazy" draggable={false} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Briefcase className="h-14 w-14 text-wm-cyan/80" aria-hidden />
                    </span>
                  )}
                </span>
              </span>
              <Face icon={cat.icon} label={cat.label} count={count} unit={unit} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Phần chữ dưới ảnh: biểu tượng tròn + tên + số lượng */
function Face({ icon: Icon, label, count, unit }: { icon: CategoryEntry['cat']['icon']; label: string; count: number; unit: string }) {
  return (
    <span className="relative flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
      <span className="flex items-center gap-2 sm:gap-3">
        <span aria-hidden className="hidden h-10 w-10 sm:inline-flex shrink-0 items-center justify-center rounded-full border border-wm-cyan/50 bg-wm-cyan/15 text-wm-cyan">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 break-words font-display text-base font-semibold leading-tight sm:text-lg md:text-xl">{label}</span>
      </span>
      <span className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="tnum font-display text-2xl sm:text-3xl font-semibold leading-none text-wm-cyan">{count}</span>
        <span className="text-sm">{unit}</span>
      </span>
    </span>
  )
}
