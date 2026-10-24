import Reveal from '@components/motion/Reveal'
import type { PublicApplicant } from '@pages/public/jobs/data'
import { Initials, TagList } from './DetailBlocks'

/** Thẻ người ứng tuyển ẩn danh (hồ sơ mẫu) — không ảnh mặt, chỉ chữ viết tắt. */
export default function ApplicantCard({ a }: { a: PublicApplicant }) {
  return (
    <Reveal>
      <article className="rounded-card border border-page-line bg-page-bg p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Initials text={a.initials} />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Người ứng tuyển</p>
            <h3 className="font-display text-lg font-semibold">{a.alias}</h3>
          </div>
        </div>
        <p className="mt-5 leading-relaxed">{a.summary}</p>
        <p className="mt-2 text-sm text-page-muted">Lịch rảnh: {a.availability}</p>
        <div className="mt-4">
          <TagList items={a.skills} />
        </div>
        <p className="mt-5 border-l-2 border-page-line pl-4 leading-relaxed">“{a.wants}”</p>
        <p className="mt-5 text-xs text-page-muted">Hồ sơ mẫu, đã ẩn danh.</p>
      </article>
    </Reveal>
  )
}
