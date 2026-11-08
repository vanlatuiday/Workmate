import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

import { photoSrcSet, photoUrl } from '@components/discover/types'
import { availabilityLabel, type MatchCandidate } from '@pages/public/match/data'
import Tilt from '@components/motion/Tilt'
import { cn } from '@utils/cn'

/**
 * Thẻ ứng viên trên trang chủ (cho nhà tuyển dụng) — cùng dáng với JobCard: ảnh không lộ mặt,
 * tên viết tắt, tóm tắt, khu vực · khoảng cách, tình trạng sẵn sàng, tối đa 2 kỹ năng.
 * `<li data-job-card>` để dùng chung hiệu ứng hiện dần `useCardsEnter`.
 */
export default function CandidateCard({ candidate: c, className }: { candidate: MatchCandidate; className?: string }) {
  const availability = availabilityLabel(c.availability)

  return (
    <li data-job-card className={className}>
      <Tilt>
      <Link
        to="/tuyen-dung/tim-ung-vien"
        data-cursor="Xem"
        className={cn(
          'group flex h-full flex-col overflow-hidden rounded-card border border-page-line bg-page-surface',
          'transition-[transform,border-color,box-shadow] duration-500 ease-editorial',
          'hover:-translate-y-1 hover:border-page-fg hover:shadow-[0_14px_28px_-18px_var(--wm-charcoal)]',
          'focus-visible:-translate-y-1 focus-visible:border-page-fg focus-visible:shadow-[0_14px_28px_-18px_var(--wm-charcoal)]',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0',
        )}
      >
        <div className="aspect-[4/3] overflow-hidden bg-wm-mist">
          <img
            src={photoUrl(c.photo.id, 640)}
            srcSet={photoSrcSet(c.photo.id)}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw"
            alt={c.photo.alt}
            width={640}
            height={480}
            loading="lazy"
            data-tilt-media className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs text-page-muted">{availability}</p>
          <h3 className="mt-1 font-display text-xl font-medium leading-snug text-page-fg">{c.name}</h3>
          <p className="mt-3 text-sm font-medium text-page-fg">{c.summary}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-page-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {c.area} · {c.distanceKm.toLocaleString('vi-VN')} km
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {c.criteria.skills.slice(0, 2).map((s) => (
              <span key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{s}</span>
            ))}
          </div>
        </div>
      </Link>
      </Tilt>
    </li>
  )
}
