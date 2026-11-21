// Thẻ "Tiêu chí của bạn" ở cột phải đầu trang /match (người tìm việc): tóm tắt các tiêu chí đang dùng để chấm điểm.
// Số liệu do JobseekerMatch truyền vào (hồ sơ + phần đã chỉnh tại chỗ), thẻ không tự đọc kho nên luôn khớp danh sách.
import { Banknote, Briefcase, CalendarDays, MapPin, SlidersHorizontal, Sparkles, type LucideIcon } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { formatHourlyFromK } from '@utils/format'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import type { JobType } from '@/types'

// Mỗi dòng: ô biểu tượng 28px (nền abyss 6%) + nhãn mờ bên trái, giá trị đậm căn phải
const ROW = 'flex items-center justify-between gap-3 border-b border-page-line py-2.5 text-sm last:border-b-0'
const TILE = 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-wm-abyss/[0.06] text-wm-abyss'

function Label({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <dt className="flex shrink-0 items-center gap-2.5 text-page-muted">
      <span className={TILE} aria-hidden="true"><Icon className="h-4 w-4" /></span>
      {text}
    </dt>
  )
}

export default function CriteriaSummary({
  slotCount,
  maxDistanceKm,
  salaryMinK,
  jobTypes,
  skillCount,
  onEdit,
  layout = 'card',
}: {
  slotCount: number
  maxDistanceKm: number
  salaryMinK: number
  jobTypes: JobType[]
  skillCount: number
  onEdit: (button: HTMLButtonElement) => void
  /** card: thẻ dọc ở cột phải; bar: một dải ngang (đặt dưới ô tìm kiếm khi bìa căn giữa) */
  layout?: 'card' | 'bar'
}) {
  const typeLabels = jobTypes.map((t) => JOB_TYPES.find((x) => x.value === t)?.label ?? t)
  if (layout === 'bar') {
    const salary = formatHourlyFromK(salaryMinK).replace(/^t/, 'T')
    const items: { icon: LucideIcon; label: string; value: string }[] = [
      { icon: CalendarDays, label: 'Lịch rảnh', value: `${slotCount} buổi/tuần` },
      { icon: MapPin, label: 'Khoảng cách', value: `Trong ${maxDistanceKm} km` },
      { icon: Banknote, label: 'Lương', value: salary },
      { icon: Briefcase, label: 'Loại việc', value: typeLabels.length === 0 ? 'Chưa chọn' : typeLabels.join(', ') },
      { icon: Sparkles, label: 'Kỹ năng', value: `${skillCount} kỹ năng` },
    ]
    return (
      <section
        aria-labelledby="match-summary-title"
        className="day-card flex flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-card border border-page-line bg-page-bg p-2 text-left text-page-fg sm:px-3"
      >
        <h2 id="match-summary-title" className="sr-only">Tiêu chí của bạn</h2>
        <dl className="flex min-w-0 flex-wrap items-center justify-center gap-y-2 text-sm">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={cn('flex min-w-0 items-center gap-2 px-3', i > 0 && 'sm:border-l sm:border-page-line')}
            >
              <dt className="flex shrink-0 items-center gap-2 text-page-muted">
                <span className={TILE} aria-hidden="true"><it.icon className="h-4 w-4" /></span>
                {it.label}
              </dt>
              <dd className="tnum min-w-0 truncate font-medium">{it.value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-controls="match-criteria"
          onClick={(e) => onEdit(e.currentTarget)}
          className={cn(BTN_SECONDARY, BTN_SM, 'shrink-0')}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Sửa tiêu chí
        </button>
      </section>
    )
  }
  return (
    <section aria-labelledby="match-summary-title" className="day-card rounded-card border border-page-line bg-page-bg flex h-full flex-col p-5 text-page-fg">
      <h2 id="match-summary-title" className="font-display text-lg font-semibold">Tiêu chí của bạn</h2>
      <dl className="mt-2 flex-1">
        <div className={ROW}>
          <Label icon={CalendarDays} text="Lịch rảnh" />
          <dd className="tnum font-medium">{slotCount} buổi/tuần</dd>
        </div>
        <div className={ROW}>
          <Label icon={MapPin} text="Khoảng cách" />
          <dd className="tnum font-medium">Trong {maxDistanceKm} km</dd>
        </div>
        <div className={ROW}>
          <Label icon={Banknote} text="Lương" />
          <dd className="tnum font-medium">{formatHourlyFromK(salaryMinK).replace(/^t/, 'T')}</dd>
        </div>
        <div className={ROW}>
          <Label icon={Briefcase} text="Loại việc" />
          <dd className="flex min-w-0 flex-wrap justify-end gap-1.5">
            {typeLabels.length === 0 ? (
              <span className="text-page-muted">Chưa chọn</span>
            ) : (
              typeLabels.map((l) => (
                <span key={l} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs font-medium">{l}</span>
              ))
            )}
          </dd>
        </div>
        <div className={ROW}>
          <Label icon={Sparkles} text="Kỹ năng" />
          <dd className="tnum font-medium">{skillCount} kỹ năng</dd>
        </div>
      </dl>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls="match-criteria"
        onClick={(e) => onEdit(e.currentTarget)}
        className={cn(BTN_SECONDARY, BTN_SM, 'mt-4 w-full')}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Sửa tiêu chí
      </button>
    </section>
  )
}
