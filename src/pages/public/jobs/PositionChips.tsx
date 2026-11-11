import { Link } from 'react-router-dom'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatHourlyRangeK } from '@utils/format'
import type { MatchJob } from './catalog'

const MAX_CHIPS = 4

/** "28.000–32.000đ/giờ" từ khoảng lương (nghìn đồng/giờ) */
const salaryShort = (j: MatchJob) => formatHourlyRangeK(j.salaryMinK, j.salaryMaxK)

const CHIP = `inline-flex items-center rounded-full border border-page-line px-3 py-1 text-xs transition-colors duration-300 hover:border-page-fg ${FOCUS}`

/**
 * Các vị trí đang tuyển của một công ty dạng chip ("Pha chế ca tối · 28.000–32.000đ/giờ"), mỗi chip là link tới tin.
 * Quá 4 vị trí thì chip "+N" dẫn tới trang công ty (nơi có đủ danh sách).
 */
export default function PositionChips({ jobs, moreHref, heading, className, max = MAX_CHIPS, more = true }: {
  jobs: MatchJob[]
  /** Số chip tối đa trước chip "+N" */
  max?: number
  /** false: bỏ chip "+N" (khi tiêu đề đã ghi tổng số vị trí và có nút sang trang công ty) */
  more?: boolean
  moreHref: string
  heading: string
  className?: string
}) {
  const shown = jobs.slice(0, max)
  const rest = jobs.length - shown.length
  return (
    <div className={className}>
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{heading}</h3>
      {jobs.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {shown.map((j) => (
            <li key={j.id}>
              <Link to={`/viec-lam/${j.id}`} className={cn(CHIP, 'text-page-fg')}>
                {j.title} · {salaryShort(j)}
              </Link>
            </li>
          ))}
          {more && rest > 0 && (
            <li>
              <Link to={moreHref} state={{ from: '/viec-lam' }} className={cn(CHIP, 'text-page-muted')} aria-label={`Xem thêm ${rest} vị trí`}>
                +{rest}
              </Link>
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-page-muted">Chưa có tin đang mở.</p>
      )}
    </div>
  )
}
