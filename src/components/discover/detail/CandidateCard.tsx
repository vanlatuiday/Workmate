import { ProfileTag } from '../parts'
import { SEEKER_PUBLIC_HREF } from '@pages/public/personal/links'
import { Link } from 'react-router-dom'
import Reveal from '@components/motion/Reveal'
import type { MockCandidate } from '@pages/recruiter/mockData'
import { Initials, TagList } from './DetailBlocks'

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'

/** Thẻ ứng viên gợi ý của một tin (dữ liệu mẫu, tên viết tắt như khu tuyển dụng). */
export default function CandidateCard({ c, jobId }: { c: MockCandidate; jobId: string }) {
  const initials = c.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .replace(/\./g, '')
    .slice(0, 2)
  return (
    <Reveal>
      <article className="rounded-card border border-page-line bg-page-bg p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Initials text={initials} />
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold">{c.name}</h3>
            <p className="text-sm text-page-muted">
              {c.area} · cách {c.distanceKm} km
            </p>
          </div>
          <p className="ml-auto shrink-0 text-right text-sm">
            <span className="block font-display text-lg font-semibold">{c.score}%</span>
            <span className="text-xs text-page-muted">phù hợp (mẫu)</span>
          </p>
        </div>
        <div className="mt-5">
          <TagList items={c.skills} />
        </div>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-page-muted">Khớp lịch</dt>
            <dd>
              Khớp {c.matchedShifts}/{c.totalShifts} ca
            </dd>
          </div>
          <div>
            <dt className="text-page-muted">Lương mong muốn</dt>
            <dd>{c.expectedSalary}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <ProfileTag to={SEEKER_PUBLIC_HREF}>Hồ sơ ứng viên</ProfileTag>
        <Link
          to={`/tuyen-dung/ung-vien-phu-hop?job=${jobId}`}
          className={`link-underline inline-block rounded-control text-sm text-page-muted hover:text-page-fg ${FOCUS}`}
        >
          Xem trong khu tuyển dụng
        </Link>
        </div>
      </article>
    </Reveal>
  )
}
