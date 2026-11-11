import { Link } from 'react-router-dom'
import Reveal from '@components/motion/Reveal'
import type { MatchCandidate } from '@pages/public/match/data'
import { candidateHref } from '@pages/public/personal/links'
import { FOCUS } from '@utils/focus'
import { Initials, TagList } from './DetailBlocks'

const initialsOf = (name: string) => name.replace(/\./g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

/** Thẻ ứng viên phù hợp với một tin; tên đầy đủ chỉ mở sau khi hai bên kết nối */
export default function CandidateCard({ c, score, slots, jobId }: { c: MatchCandidate; score: number; slots: string[]; jobId?: string }) {
  const matched = slots.filter((s) => c.criteria.slots.includes(s)).length
  return (
    <Reveal>
      <article className="rounded-card border border-page-line bg-page-bg p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Initials text={initialsOf(c.name)} />
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold">{c.name}</h3>
            <p className="text-sm text-page-muted">
              {c.area || 'Chưa nêu khu vực'} · cách {c.distanceKm} km
            </p>
          </div>
          <p className="ml-auto shrink-0 text-right text-sm">
            <span className="block font-display text-lg font-semibold">{score}%</span>
            <span className="text-xs text-page-muted">phù hợp</span>
          </p>
        </div>
        {c.criteria.skills.length > 0 && (
          <div className="mt-5">
            <TagList items={c.criteria.skills} />
          </div>
        )}
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-page-muted">Khớp lịch</dt>
            <dd>Khớp {matched}/{slots.length} ca</dd>
          </div>
          <div>
            <dt className="text-page-muted">Bắt đầu</dt>
            <dd>{c.availability.kind === 'working' ? 'Đang đi làm' : c.availability.from ? `từ ${c.availability.from}` : 'ngay'}</dd>
          </div>
          <div>
            <dt className="text-page-muted">Lương mong muốn</dt>
            <dd>từ {c.criteria.salaryMinK}.000đ/giờ</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link to={candidateHref(c.id)} className={`link-underline inline-block rounded-control text-sm font-medium ${FOCUS}`}>
            Xem hồ sơ<span className="sr-only"> {c.name}</span>
          </Link>
          <Link to={jobId ? `/match?job=${encodeURIComponent(jobId)}` : '/match'} className={`link-underline inline-block rounded-control text-sm text-page-muted hover:text-page-fg ${FOCUS}`}>
            Mở trang Kết nối
          </Link>
        </div>
      </article>
    </Reveal>
  )
}
