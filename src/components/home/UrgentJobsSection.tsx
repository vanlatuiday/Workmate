import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { useReducedMotion } from '@hooks/useReducedMotion'
import { seekerOutcome, useAllJobs } from '@pages/public/jobs/catalog'
import { useSeekerCriteria } from '@context/profileStore'
import TextReveal from '@components/motion/TextReveal'
import JobCard from './JobCard'
import CandidateCard from './CandidateCard'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeCandidates, useHomeRole } from './homeData'
import { useCardsEnter } from './useCardsEnter'

const COUNT = 8

const CARD = 'w-[78%] shrink-0 snap-start xs:w-72 sm:w-80'

/**
 * Section ② — hàng thẻ cuộn ngang (vuốt trên điện thoại, nút ‹ › trên máy tính).
 * Khách/quản trị: việc tuyển gấp · người tìm việc: việc hợp với bạn (xếp theo điểm, có huy hiệu %)
 * · nhà tuyển dụng: ứng viên sẵn sàng đi làm.
 */
export default function UrgentJobsSection() {
  const ref = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLUListElement>(null)
  const reduced = useReducedMotion()
  const role = useHomeRole()
  const allJobs = useAllJobs()
  const candidates = useHomeCandidates()
  // Đăng ký hồ sơ để điểm phù hợp tính lại khi người tìm việc sửa hồ sơ
  const criteria = useSeekerCriteria()

  const copy = role === 'guest' ? { ...homeSections.urgent, prev: 'Xem các việc trước', next: 'Xem các việc tiếp theo' } : homeSectionsByRole[role].urgent

  const scored = useMemo(
    () =>
      role === 'jobseeker'
        ? allJobs.map((job) => ({ job, score: seekerOutcome(job).score })).sort((a, b) => b.score - a.score).slice(0, COUNT)
        : [],
    [role, allJobs, criteria],
  )
  const jobs = allJobs.slice(0, COUNT)
  const shownCandidates = candidates.slice(0, COUNT)
  const count = role === 'recruiter' ? shownCandidates.length : role === 'jobseeker' ? scored.length : jobs.length

  const [edge, setEdge] = useState({ start: true, end: false })

  useCardsEnter(ref, count, role)

  // Cập nhật trạng thái nút ‹ › theo vị trí cuộn của hàng
  const syncEdge = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    setEdge({ start: row.scrollLeft <= 4, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 4 })
  }, [])
  useEffect(() => {
    syncEdge()
    window.addEventListener('resize', syncEdge)
    return () => window.removeEventListener('resize', syncEdge)
  }, [syncEdge, count, role])

  // Mỗi lần bấm nhích đúng một thẻ
  const scrollByCard = (dir: 1 | -1) => {
    const row = rowRef.current
    const first = row?.firstElementChild as HTMLElement | null
    if (!row || !first) return
    row.scrollBy({ left: dir * (first.offsetWidth + 16), behavior: reduced ? 'auto' : 'smooth' })
  }

  const arrow =
    'hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border border-page-line text-page-fg ' +
    'transition-colors duration-300 hover:border-page-fg disabled:opacity-40 disabled:pointer-events-none'

  return (
    <section ref={ref} data-theme="ivory" className="relative z-10 shell pt-section-sm pb-10 md:pb-14" aria-labelledby="home-urgent-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <TextReveal
            id="home-urgent-title"
            text={copy.title}
            className="font-display text-display-sm font-semibold text-page-fg"
          />
          <p className="mt-3 inline-block rounded-full border border-page-line px-3 py-1.5 text-xs text-page-muted">
            {homeSections.sampleNote}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={copy.all.href}
            className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-page-fg"
          >
            {copy.all.label}
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" aria-hidden />
          </Link>
          <button type="button" aria-label={copy.prev} disabled={edge.start} onClick={() => scrollByCard(-1)} className={arrow}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" aria-label={copy.next} disabled={edge.end} onClick={() => scrollByCard(1)} className={arrow}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Cuộn ngang native + scroll-snap. Chỉ overflow-x: lăn chuột dọc vẫn cuộn trang.
          Padding/margin âm để thẻ nhấc lên và bóng không bị cắt, và hàng tràn ra mép lề. */}
      <ul
        ref={rowRef}
        onScroll={syncEdge}
        className="-mx-6 -my-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 py-4 scroll-pl-6
                   md:-mx-10 md:px-10 md:scroll-pl-10 lg:-mx-16 lg:px-16 lg:scroll-pl-16
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {role === 'recruiter'
          ? shownCandidates.map((c) => <CandidateCard key={c.id} candidate={c} className={CARD} />)
          : role === 'jobseeker'
            ? scored.map(({ job, score }) => <JobCard key={job.id} job={job} score={score} className={CARD} />)
            : jobs.map((job) => <JobCard key={job.id} job={job} className={CARD} />)}
      </ul>
    </section>
  )
}
