import { useEffect, useId, useRef, useState } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { JobType } from '@/types'
import { DISTRICTS, EMPTY_FILTERS, hasFilters, type JobFilters } from './catalog'

const SALARY_STEPS = [25, 30, 35, 40]

const FIELD = `h-10 rounded-control border border-page-edge bg-page-surface px-3 text-sm text-page-fg ${FOCUS}`

type Props = {
  filters: JobFilters
  onChange: (next: JobFilters) => void
  /** Số công ty / số việc khớp, hiện ở dòng nhỏ dưới thanh */
  companies: number
  jobs: number
  /** "Gần tôi" cần hồ sơ có địa chỉ nên chỉ hiện cho người tìm việc */
  showNearMe?: boolean
}

/**
 * Thanh tìm kiếm/lọc ở đầu trang Việc làm. Trạng thái nằm trong URL (do trang cha giữ);
 * riêng ô gõ chữ có bản nháp cục bộ và đẩy lên URL sau ~250ms để không ghi URL mỗi phím.
 */
export default function JobSearchBar({ filters, onChange, companies, jobs, showNearMe = false }: Props) {
  const id = useId()
  const [text, setText] = useState(filters.q)
  // Giữ bản mới nhất để timer debounce không dùng bộ lọc cũ
  const latest = useRef({ filters, onChange })
  latest.current = { filters, onChange }

  useEffect(() => {
    if (text.trim() === latest.current.filters.q) return
    const t = window.setTimeout(() => latest.current.onChange({ ...latest.current.filters, q: text.trim() }), 250)
    return () => window.clearTimeout(t)
  }, [text])

  const set = (patch: Partial<JobFilters>) => onChange({ ...filters, ...patch })
  const clear = () => {
    setText('')
    onChange(EMPTY_FILTERS)
  }

  return (
    <div className="border-b border-page-line bg-page-bg py-4">
      <div className="shell">
        <div className="flex flex-wrap items-center gap-3" role="search">
          <div className="relative min-w-[14rem] flex-1">
            <label htmlFor={`${id}-q`} className="sr-only">Tìm việc, công ty, kỹ năng</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input
              id={`${id}-q`}
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tìm việc, công ty, kỹ năng…"
              className={cn(FIELD, 'w-full pl-9 placeholder:text-page-muted')}
            />
          </div>

          <div>
            <label htmlFor={`${id}-district`} className="sr-only">Quận</label>
            <select id={`${id}-district`} value={filters.district} onChange={(e) => set({ district: e.target.value })} className={FIELD}>
              <option value="">Mọi quận</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor={`${id}-type`} className="sr-only">Loại việc</label>
            <select id={`${id}-type`} value={filters.type} onChange={(e) => set({ type: e.target.value as JobType | '' })} className={FIELD}>
              <option value="">Mọi loại việc</option>
              {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor={`${id}-salary`} className="sr-only">Lương từ</label>
            <select id={`${id}-salary`} value={filters.minSalaryK} onChange={(e) => set({ minSalaryK: Number(e.target.value) })} className={FIELD}>
              <option value={0}>Mọi mức lương</option>
              {SALARY_STEPS.map((k) => <option key={k} value={k}>Từ {k}k/giờ</option>)}
            </select>
          </div>

          {showNearMe && (
            <button
              type="button"
              aria-pressed={filters.nearMe}
              onClick={() => set({ nearMe: !filters.nearMe })}
              className={cn(
                `inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-300 ${FOCUS}`,
                filters.nearMe ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
              )}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Gần tôi
            </button>
          )}

          {hasFilters(filters) && (
            <button
              type="button"
              onClick={clear}
              className={`inline-flex h-10 items-center gap-1.5 rounded-control px-2 text-sm text-page-fg underline underline-offset-4 ${FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Xóa lọc
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-page-muted" role="status">
          {companies} công ty · {jobs} việc khớp
        </p>
      </div>
    </div>
  )
}
