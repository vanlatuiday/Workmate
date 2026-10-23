import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'

import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import RollText from '@components/motion/RollText'
import { type SampleJob } from './content'
import { useHomeCopy } from './useAudience'

/**
 * Bố cục bento cho 6 thẻ — thẻ đầu lớn. Luôn 6 thẻ (`opportunities.cards` trong `homeCopy`).
 * Trên màn nhỏ tất cả về một cột.
 */
const SPANS = [
  'md:col-span-2 lg:col-span-7 lg:row-span-2',
  'lg:col-span-5',
  'lg:col-span-5',
  'lg:col-span-4',
  'lg:col-span-4',
  'md:col-span-2 lg:col-span-4',
]

/** Section C — thẻ việc làm mẫu. Bấm vào thẻ là tìm việc theo chức danh đó. */
export default function OpportunitiesSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { opportunities: opp } = useHomeCopy()

  // Parallax nhẹ cho hình minh họa trong thẻ lớn
  useGSAP(
    () => {
      if (reduced) return
      gsap.fromTo(
        '[data-parallax]',
        { yPercent: 12 },
        {
          yPercent: -12,
          ease: 'none',
          scrollTrigger: { trigger: '[data-parallax]', start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section ref={ref} data-theme="stone" className="shell pb-section">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal y={16}>
            <p className="eyebrow text-page-muted">
              <span className="w-8 h-px bg-page-line" />
              {opp.eyebrow}
            </p>
          </Reveal>
          <TextReveal
            text={opp.title}
            className="font-display text-display-sm font-semibold text-page-fg mt-6"
          />
        </div>

        <Reveal delay={0.2}>
          <p className="text-xs text-page-muted border border-page-line rounded-full px-3 py-1.5">
            {opp.notice}
          </p>
        </Reveal>
      </div>

      <ul className="grid md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(13rem,auto)] gap-4 mt-14">
        {opp.cards.map((job, i) => (
          <li key={job.title} className={SPANS[i]}>
            <Reveal y={24} delay={(i % 3) * 0.08} className="h-full">
              <JobCard job={job} featured={i === 0} label={opp.cardLabel} href={opp.cardHref} />
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal className="mt-10">
        <Link to={opp.link.href} className="group inline-flex items-center gap-2 text-sm text-page-fg">
          <RollText>{opp.link.label}</RollText>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </Reveal>
    </section>
  )
}

function JobCard({ job, featured, label, href }: { job: SampleJob; featured: boolean; label: string; href?: string }) {
  return (
    <Link
      to={href ?? `/viec-lam?keyword=${encodeURIComponent(job.title)}`}
      data-cursor="Tìm"
      className={cn(
        'group relative flex flex-col h-full overflow-hidden rounded-card border border-page-line p-6 md:p-7',
        // Nền thẻ nhỉnh hơn nền trang một chút, tự khớp khi nền đổi màu
        'bg-page-surface',
        'hover:border-page-fg focus-visible:border-page-fg outline-none transition-colors duration-500 ease-editorial',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] uppercase tracking-[0.16em] text-page-muted">{label}</span>
        <ArrowUpRight
          className="w-5 h-5 text-page-fg -translate-x-1 translate-y-1 opacity-60
                     group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100
                     transition-[transform,opacity] duration-500 ease-editorial"
        />
      </div>

      {featured && <ScheduleVisual />}

      <h3
        className={cn(
          'font-display font-medium text-page-fg leading-tight mt-auto pt-8',
          featured ? 'text-display-sm' : 'text-2xl',
        )}
      >
        {job.title}
      </h3>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-page-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        <span className="border border-page-line rounded-full px-2.5 py-0.5 text-xs">{job.type}</span>
        <span className="text-page-fg">{job.salary}</span>
      </div>
    </Link>
  )
}

/**
 * Hình minh họa placeholder: một tuần lịch rảnh, các ô tô đậm là ca khớp.
 * Thay bằng ảnh/minh họa thật khi có — chỉ cần giữ `data-parallax` nếu muốn parallax.
 */
function ScheduleVisual() {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  // Ca khớp với lịch rảnh: [ngày, hàng] — hàng 0 sáng, 1 chiều, 2 tối
  const matched = new Set(['0-2', '1-1', '2-2', '4-2', '5-0', '5-1', '6-1'])

  return (
    <div aria-hidden className="relative mt-8">
      <div data-parallax className="grid grid-cols-7 gap-1.5">
        {days.map((day, d) => (
          <div key={day} className="flex flex-col gap-1.5">
            <span className="text-[10px] text-page-muted text-center tnum">{day}</span>
            {[0, 1, 2].map((row) => (
              <span
                key={row}
                className={cn(
                  'h-8 md:h-10 rounded-md',
                  matched.has(`${d}-${row}`) ? 'bg-page-fg' : 'border border-page-line',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
