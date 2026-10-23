import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import MaskedWords from '@components/motion/MaskedWords'
import { steps } from './content'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Section D — quy trình 3 bước. Số thứ tự lớn, mỗi bước hiện ra theo tiến
 * trình cuộn và một vạch dọc chạy dọc theo các bước. Cuộn ngược là thu lại.
 */
export default function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return

      gsap.fromTo(
        '[data-title] [data-word]',
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.04,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-title]', start: 'top 85%', end: 'top 45%', scrub: 0.6 },
        },
      )

      gsap.fromTo(
        '[data-progress]',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '[data-steps]', start: 'top 70%', end: 'bottom 60%', scrub: true },
        },
      )

      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
        gsap.fromTo(
          step.children,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: step, start: 'top 85%', end: 'top 55%', scrub: 0.6 },
          },
        )
      })
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section ref={ref} data-theme="graphite" className="shell py-section">
      <p className="eyebrow text-page-muted">
        <span className="w-8 h-px bg-page-line" />
        Cách Workmate hoạt động
      </p>

      <div data-title>
        <MaskedWords
          text="Ba bước, không cần CV dài."
          className="font-display text-display-md font-semibold text-page-fg mt-8 max-w-[14ch]"
        />
      </div>

      <div data-steps className="relative mt-16 md:mt-24">
        {/* Vạch tiến trình dọc bên trái các bước */}
        <div aria-hidden className="absolute left-0 top-0 bottom-0 w-px bg-page-line">
          <span data-progress className="absolute inset-0 origin-top bg-page-fg" />
        </div>

        <ol>
          {steps.map((step, i) => (
            <li
              key={step.title}
              data-step
              className="grid grid-cols-[auto_1fr] md:grid-cols-12 gap-x-6 md:gap-x-8 gap-y-3 pl-6 md:pl-10
                         py-10 md:py-14 border-b border-page-line last:border-b-0"
            >
              <span
                aria-hidden
                className="row-span-2 md:row-span-1 md:col-span-3 font-display text-display-md font-semibold
                           text-page-fg tnum leading-none"
              >
                {pad(i + 1)}
              </span>
              <h3 className="md:col-span-4 font-display text-2xl md:text-3xl font-medium text-page-fg leading-snug">
                <span className="sr-only">Bước {i + 1}: </span>
                {step.title}
              </h3>
              <p className="md:col-span-5 text-page-muted leading-relaxed max-w-md">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
