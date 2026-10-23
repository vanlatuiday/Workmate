import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

import { gsap, useGSAP } from '@utils/gsap'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { scrollToY } from '@hooks/useSmoothScroll'
import { cn } from '@utils/cn'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import RollText from '@components/motion/RollText'

export type FeaturedJob = {
  id: string
  title: string
  company: string
  location: string
  salary: string
  type: string
  match: number
  tags: string[]
}

type Props = {
  jobs: FeaturedJob[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Việc làm nổi bật. Màn hình lớn: ghim section, cuộn dọc để kéo dải thẻ
 * sang ngang. Màn hình nhỏ hoặc tắt chuyển động: lưới thẻ như cũ.
 */
export default function HorizontalJobs({ jobs }: Props) {
  const horizontal = useMediaQuery('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
  return horizontal ? <Track jobs={jobs} /> : <Grid jobs={jobs} />
}

function Heading({ aside }: { aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <Reveal y={16}>
          <p className="eyebrow text-ink-400">
            <span className="w-8 h-px bg-ink-600" />
            Việc làm nổi bật
          </p>
        </Reveal>
        <TextReveal
          text="Đang tuyển ngay tuần này."
          className="font-display text-display-sm font-semibold text-white mt-6"
        />
      </div>
      {aside}
    </div>
  )
}

/** Ghi vị trí con trỏ trong thẻ vào biến CSS để vệt sáng bám theo. */
function trackSpotlight(e: React.PointerEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
}

function JobCard({ job, index, className }: { job: FeaturedJob; index: number; className?: string }) {
  return (
    <Link
      to={`/viec-lam/${job.id}`}
      data-cursor="Xem"
      onPointerMove={trackSpotlight}
      className={cn(
        // isolate + -z-10 ở vệt sáng: nằm trên nền thẻ nhưng dưới chữ
        'group relative isolate flex flex-col h-full bg-ink-900 p-7',
        'hover:bg-ink-800 focus-visible:bg-ink-800 transition-colors duration-500 ease-editorial',
        'outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-200',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100
                   transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(74, 222, 128, 0.09), transparent 65%)',
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <span className="text-xs text-ink-400 tnum">{pad(index + 1)}</span>
        <span className="text-xs font-medium text-secondary-400 tnum">{job.match}% phù hợp</span>
      </div>

      <h3 className="font-display text-2xl font-medium text-white mt-8 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink-400 mt-2">{job.company}</p>

      {/* Chi tiết mở ra khi hover / focus */}
      <div
        className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr]
                   transition-[grid-template-rows] duration-500 ease-editorial"
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-1.5 pt-5">
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-ink-200 border border-ink-600 rounded-full px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-base text-white">{job.salary}</p>
          <p className="text-xs text-ink-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {job.location}
          </p>
        </div>
        <span className="text-xs text-ink-400 border border-ink-600 rounded-full px-3 py-1 shrink-0">
          {job.type}
        </span>
      </div>
    </Link>
  )
}

function Track({ jobs }: Props) {
  const pinRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const stRef = useRef<ScrollTriggerType | null>(null)

  // Quãng đường dải thẻ phải trượt để thẻ cuối chạm mép phải khung nội dung
  const distance = () => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport) return 0
    return Math.max(0, track.scrollWidth - viewport.clientWidth)
  }

  useGSAP(
    () => {
      const tween = gsap.to(trackRef.current, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (counterRef.current) {
              counterRef.current.textContent = pad(Math.round(self.progress * (jobs.length - 1)) + 1)
            }
          },
        },
      })
      stRef.current = tween.scrollTrigger ?? null

      gsap.fromTo(
        '[data-progress]',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: pinRef.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      )
    },
    { scope: pinRef, dependencies: [jobs.length] },
  )

  // Thẻ nằm ngoài khung bị dịch bằng transform nên trình duyệt không tự
  // cuộn tới khi Tab vào. Tự quy đổi vị trí ngang của thẻ ra vị trí cuộn dọc.
  const handleFocus = (e: React.FocusEvent<HTMLUListElement>) => {
    const st = stRef.current
    const item = (e.target as HTMLElement).closest('li')
    const max = distance()
    if (!st || !item || max === 0) return

    const x = Math.min(Math.max(item.offsetLeft, 0), max)
    scrollToY(st.start + (x / max) * (st.end - st.start))
  }

  return (
    <section className="border-t border-ink-700">
      <div ref={pinRef} className="h-screen overflow-clip flex flex-col justify-center">
        <div className="shell w-full">
          <Heading
            aside={
              <Reveal delay={0.2}>
                <p className="text-sm text-ink-400 tnum" aria-hidden>
                  <span ref={counterRef} className="text-white">01</span> / {pad(jobs.length)}
                </p>
              </Reveal>
            }
          />

          <div ref={viewportRef} className="w-full mt-14">
            <ul
              ref={trackRef}
              onFocus={handleFocus}
              className="flex w-max border border-ink-700 rounded-2xl overflow-hidden divide-x divide-ink-700"
            >
              {jobs.map((job, i) => (
                <li key={job.id} className="w-[26rem] h-[min(24rem,48vh)]">
                  <JobCard job={job} index={i} />
                </li>
              ))}

              <li className="w-[20rem] h-[min(24rem,48vh)]">
                <Link
                  to="/viec-lam"
                  className="group flex flex-col justify-between h-full p-7 bg-ink-800 text-white
                             hover:bg-ink-700 focus-visible:bg-ink-700 transition-colors duration-500 ease-editorial
                             outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink-200"
                >
                  <span className="eyebrow text-ink-400">Còn 2.400+ việc nữa</span>
                  <span className="font-display text-display-sm font-semibold leading-tight">
                    Xem tất cả việc làm
                  </span>
                  <ArrowRight
                    className="w-6 h-6 transition-transform duration-500 ease-editorial group-hover:translate-x-2"
                  />
                </Link>
              </li>
            </ul>

            <div className="relative h-px mt-8 bg-ink-700">
              <span data-progress className="absolute inset-0 origin-left bg-ink-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Grid({ jobs }: Props) {
  return (
    <section className="shell py-section border-t border-ink-700">
      <Heading
        aside={
          <Reveal delay={0.2}>
            <Link to="/viec-lam" className="group text-sm text-ink-200 hover:text-white">
              <RollText>Xem tất cả</RollText>
            </Link>
          </Reveal>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-700 border border-ink-700 rounded-2xl overflow-hidden mt-16">
        {jobs.map((job, i) => (
          <Reveal key={job.id} y={20} delay={(i % 3) * 0.08}>
            <JobCard job={job} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
