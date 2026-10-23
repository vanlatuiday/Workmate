import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useMediaQuery } from '@hooks/useMediaQuery'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'

export type Statement = {
  label: string
  title: string
  body: string
}

type Props = {
  items: Statement[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Ba khối tuyên ngôn. Màn hình lớn: ghim lại một màn, cuộn để lần lượt
 * thay câu. Màn hình nhỏ hoặc tắt chuyển động: xếp chồng như bình thường.
 */
export default function PinnedStatements({ items }: Props) {
  const pinned = useMediaQuery('(min-width: 768px) and (prefers-reduced-motion: no-preference)')
  return pinned ? <Pinned items={items} /> : <Stacked items={items} />
}

function Pinned({ items }: Props) {
  const pinRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const slides = gsap.utils.toArray<HTMLElement>('[data-slide]')
      const numbers = gsap.utils.toArray<HTMLElement>('[data-num]')
      const words = slides.map((s) => s.querySelectorAll('[data-word]'))
      const bodies = slides.map((s) => s.querySelector('[data-body]'))

      // Câu đầu hiện sẵn, các câu sau nằm dưới mặt nạ. Đẩy xa hơn 100% và
      // ẩn hẳn cả khối: dấu tiếng Việt nhô ra ngoài hộp chữ sẽ lọt qua phần
      // đệm đáy của mặt nạ, chồng lên câu đang hiện.
      gsap.set(slides.slice(1), { autoAlpha: 0 })
      gsap.set(words.slice(1), { yPercent: 140 })
      gsap.set(bodies.slice(1), { autoAlpha: 0, y: 24 })
      gsap.set(numbers.slice(1), { autoAlpha: 0, yPercent: 40 })

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: `+=${items.length * 100}%`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })

      // Giữ câu đầu một nhịp trước khi chuyển
      tl.to({}, { duration: 0.4 })

      for (let i = 1; i < slides.length; i++) {
        tl.to(words[i - 1], { yPercent: -140, duration: 0.5, stagger: 0.015 })
          .to(bodies[i - 1], { autoAlpha: 0, y: -24, duration: 0.4 }, '<')
          .to(numbers[i - 1], { autoAlpha: 0, yPercent: -40, duration: 0.4 }, '<')
          .set(slides[i], { autoAlpha: 1 }, '-=0.2')
          .to(words[i], { yPercent: 0, duration: 0.5, stagger: 0.015 }, '<')
          .to(bodies[i], { autoAlpha: 1, y: 0, duration: 0.4 }, '<0.15')
          .to(numbers[i], { autoAlpha: 1, yPercent: 0, duration: 0.4 }, '<')
          .set(slides[i - 1], { autoAlpha: 0 })
          .to({}, { duration: 0.6 })
      }

      // Thanh tiến trình chạy suốt chiều dài timeline
      tl.fromTo(
        '[data-progress]',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', duration: tl.duration() },
        0,
      )
    },
    { scope: pinRef, dependencies: [items.length] },
  )

  return (
    <section className="border-t border-ink-700">
      <div ref={pinRef} className="h-screen overflow-clip">
        <div className="shell h-full grid grid-cols-12 gap-8 items-center">
          {/* Cột trái: số thứ tự lớn + thanh tiến trình */}
          <div className="col-span-4 flex gap-6 self-stretch items-center">
            <div className="relative w-px self-stretch my-[18vh] bg-ink-700">
              <span
                data-progress
                className="absolute inset-0 origin-top bg-ink-200"
              />
            </div>

            <div className="grid">
              {items.map((s, i) => (
                <div
                  key={s.label}
                  data-num
                  aria-hidden
                  className="[grid-area:1/1]"
                >
                  <p className="font-display text-display-lg font-semibold text-ink-600 tnum leading-none">
                    {pad(i + 1)}
                  </p>
                  <p className="eyebrow text-ink-400 mt-4">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: các câu chồng lên cùng một ô lưới */}
          <div className="col-span-8 grid">
            {items.map((s, i) => (
              <article key={s.label} data-slide className="[grid-area:1/1]">
                <p className="sr-only">
                  {pad(i + 1)} — {s.label}
                </p>
                <h2 className="font-display text-display-md font-semibold text-white max-w-[18ch]">
                  <span className="sr-only">{s.title}</span>
                  <span aria-hidden>
                    {s.title.split(' ').map((word, j, arr) => (
                      <span key={`${word}-${j}`}>
                        {/* pb/-mb: nới đáy mặt nạ để dấu tiếng Việt không bị cắt */}
                        <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
                          <span data-word className="inline-block">
                            {word}
                          </span>
                        </span>
                        {j < arr.length - 1 && ' '}
                      </span>
                    ))}
                  </span>
                </h2>
                <p data-body className="mt-8 text-lg text-ink-200 leading-relaxed max-w-xl">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Stacked({ items }: Props) {
  return (
    <section className="border-t border-ink-700">
      {items.map((s, i) => (
        <div key={s.label} className="border-b border-ink-700">
          <div className="shell py-section-sm grid md:grid-cols-12 gap-8 items-start">
            <Reveal className="md:col-span-3" y={16}>
              <p className="eyebrow text-ink-400 tnum">
                {pad(i + 1)} — {s.label}
              </p>
            </Reveal>

            <div className="md:col-span-9">
              <TextReveal
                text={s.title}
                className="font-display text-display-sm font-semibold text-white max-w-[22ch]"
              />
              <Reveal delay={0.2}>
                <p className="mt-6 text-ink-200 leading-relaxed max-w-xl">{s.body}</p>
              </Reveal>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
