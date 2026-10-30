import { Star } from 'lucide-react'
import { companyOf, candidatesOf } from '@pages/public/match/data'
import { findAnyJob } from '@pages/public/jobs/lookup'
import { useProfileStore } from '@context/profileStore'
import { ME, reviewStats, useReviews, type Review } from '@services/connectionService'
import { cn } from '@utils/cn'
import { formatRelativeTime } from '@utils/format'
import { abbreviateName } from './format'

/** Hàng sao (chỉ hiển thị): sao đầy theo số điểm, có nhãn chữ cho trình đọc màn hình */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} trên 5 sao`} className={cn('inline-flex items-center gap-0.5 text-page-fg', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('h-4 w-4', n <= Math.round(value) ? 'fill-current' : 'text-page-edge')} aria-hidden="true" />
      ))}
    </span>
  )
}

const LATEST = 4

/** Một khối "Đánh giá": điểm trung bình + số lượng + vài đánh giá mới nhất; trống thì có dòng giải thích */
function ReviewBlock({ title, reviews, nameOf, emptyText, hideTitle }: {
  title: string
  /** Ẩn tiêu đề nhìn thấy (trang đã có tiêu đề riêng), vẫn giữ cho trình đọc màn hình */
  hideTitle?: boolean
  reviews: Review[]
  nameOf: (r: Review) => string
  emptyText: string
}) {
  const { average, count } = reviewStats(reviews)
  return (
    <section aria-label={title}>
      <h3 className={hideTitle ? 'sr-only' : 'text-xs font-medium uppercase tracking-[0.18em] text-page-muted'}>{title}</h3>
      {count === 0 ? (
        <p className="mt-2.5 rounded-card border border-dashed border-page-edge px-4 py-3 text-sm text-page-muted">{emptyText}</p>
      ) : (
        <>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-page-fg">{average.toFixed(1).replace('.', ',')}</span>
            <Stars value={average} />
            <span className="text-sm text-page-muted">{count} đánh giá</span>
          </p>
          <ul className="mt-4 divide-y divide-page-line border-y border-page-line">
            {reviews.slice(0, LATEST).map((r) => (
              <li key={`${r.jobId}|${r.seekerId}|${r.from}`} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2.5">
                    <Stars value={r.stars} />
                    <span className="text-sm font-medium text-page-fg">{nameOf(r)}</span>
                  </span>
                  <span className="text-xs text-page-muted">{formatRelativeTime(r.at)}</span>
                </div>
                {r.tags.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <li key={t} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{t}</li>
                    ))}
                  </ul>
                )}
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-page-fg">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/** Đánh giá từ người đã làm về một công ty (người viết = người tìm việc, tên rút gọn) */
export function CompanyReviews({ companyId, className, hideTitle }: { companyId: string; className?: string; hideTitle?: boolean }) {
  const all = useReviews()
  const myName = useProfileStore((s) => s.profile.fullName)
  const reviews = all.filter((r) => r.from === 'seeker' && findAnyJob(r.jobId)?.companyId === companyId)
  const nameOf = (r: Review) =>
    r.seekerId === ME ? abbreviateName(myName) : abbreviateName(candidatesOf(r.jobId).find((c) => c.id === r.seekerId)?.name ?? 'Người tìm việc')
  return (
    <div className={className}>
      <ReviewBlock
        title="Đánh giá từ người đã làm"
        hideTitle={hideTitle}
        reviews={reviews}
        nameOf={nameOf}
        emptyText="Chưa có đánh giá nào. Đánh giá xuất hiện sau khi người tìm việc đã đi làm tại đây."
      />
    </div>
  )
}

/** Đánh giá từ doanh nghiệp về một người tìm việc (người viết = tên công ty) */
export function SeekerReviews({ seekerId, className }: { seekerId: string; className?: string }) {
  const all = useReviews()
  const reviews = all.filter((r) => r.from === 'recruiter' && r.seekerId === seekerId)
  const nameOf = (r: Review) => {
    const cid = findAnyJob(r.jobId)?.companyId
    return cid ? companyOf(cid).name : 'Doanh nghiệp'
  }
  return (
    <div className={className}>
      <ReviewBlock
        title="Đánh giá từ doanh nghiệp"
        reviews={reviews}
        nameOf={nameOf}
        emptyText="Chưa có đánh giá nào. Đánh giá xuất hiện sau khi người tìm việc hoàn thành một đợt làm việc."
      />
    </div>
  )
}
