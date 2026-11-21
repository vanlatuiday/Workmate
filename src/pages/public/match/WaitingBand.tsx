// Dải "Doanh nghiệp đang chờ bạn" trên tabs của /match: các việc mà nhà tuyển dụng đã quan tâm bạn trước,
// chỉ còn chờ bạn đồng ý để mở kênh chat. Ẩn hẳn khi không có việc nào.
import CompanyLogo from '@components/common/CompanyLogo'
import { cn } from '@utils/cn'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { companyOf, type MatchJob } from './data'
import { fitTone } from './gallery/MatchGallery'

export default function WaitingBand({
  items,
  onAccept,
  onView,
}: {
  items: { job: MatchJob; score: number }[]
  onAccept: (job: MatchJob) => void
  onView: (job: MatchJob, button: HTMLElement) => void
}) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="match-waiting-title" className="relative mb-8 overflow-hidden rounded-card border border-wm-azure/35 bg-[color-mix(in_srgb,var(--wm-azure)_14%,var(--wm-day))] p-5 shadow-[0_12px_32px_-18px_color-mix(in_srgb,var(--wm-azure)_45%,transparent)] pl-6 text-page-fg md:p-6 md:pl-7">
      {/* Vạch nhấn azure bên trái để dải nổi hơn phần còn lại */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-wm-azure" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 id="match-waiting-title" className="flex items-center gap-2 font-display text-xl font-semibold">
          Doanh nghiệp đang chờ bạn
          <span className="tnum rounded-full bg-wm-abyss/[0.07] px-2.5 py-0.5 text-sm font-semibold">{items.length}</span>
        </h2>
        {/* Viên "Mới": chấm nhịp nhẹ (opacity/scale), giảm chuyển động thì đứng yên */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-wm-abyss/[0.07] px-2.5 py-0.5 text-xs font-semibold text-wm-abyss">
          <span aria-hidden="true" className="wm-pulse-dot h-2 w-2 rounded-full bg-wm-azure" />
          Mới
        </span>
      </div>
      <p className="mt-1 text-sm text-page-muted">Đồng ý để mở kênh chat với họ.</p>
      <ul className="mt-4 divide-y divide-page-line">
        {items.map(({ job, score }) => {
          const company = companyOf(job.companyId)
          const v = Math.round(Math.min(100, Math.max(0, score)))
          const tone = fitTone(v)
          return (
            <li key={job.id} className="-mx-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg px-3 py-3 transition-colors duration-fast hover:bg-wm-abyss/[0.04] motion-reduce:transition-none">
              <CompanyLogo name={company.name} logoUrl={company.logoUrl} decorative />
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-display text-base font-medium">{job.title}</p>
                <p className="truncate text-sm text-page-muted">{company.name} · {job.district}</p>
              </div>
              <span
                role="img"
                aria-label={`Độ phù hợp ${v}%, ${tone.label}`}
                className={cn('tnum rounded-full px-3 py-1 text-sm font-semibold', tone.tint, tone.pillText)}
              >
                {v}%
              </span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onAccept(job)} className={cn(BTN_PRIMARY, BTN_SM)}>
                  Đồng ý kết nối<span className="sr-only"> {job.title}</span>
                </button>
                <button type="button" onClick={(e) => onView(job, e.currentTarget)} className={cn(BTN_SECONDARY, BTN_SM)}>
                  Xem việc<span className="sr-only"> {job.title}</span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
