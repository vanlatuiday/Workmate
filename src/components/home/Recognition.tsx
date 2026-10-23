import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import Counter from '@components/motion/Counter'

export type RecognitionItem = {
  label: string
  count: number
  years: string
}

type Props = {
  items: RecognitionItem[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Ghi nhận: một con số tổng thật lớn + bảng chia theo hạng mục,
 * mỗi dòng có vạch tỉ lệ so với tổng.
 */
export default function Recognition({ items }: Props) {
  const reduced = useReducedMotion()
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="shell py-section border-t border-ink-700 grid md:grid-cols-12 gap-12 md:gap-8">
      {/* Con số tổng */}
      <div className="md:col-span-5">
        <Reveal y={16}>
          <p className="eyebrow text-ink-400">
            <span className="w-8 h-px bg-ink-600" />
            Ghi nhận
          </p>
        </Reveal>

        <p className="font-display font-semibold text-white tnum leading-none tracking-[-0.05em] mt-10
                      text-[clamp(7rem,18vw,14rem)]">
          <Counter value={total} duration={2000} />
        </p>

        <TextReveal
          as="p"
          text="Giải thưởng và lần được nhắc tên kể từ ngày ra mắt."
          className="font-display text-xl text-ink-200 mt-6 max-w-[22ch] leading-snug"
        />
      </div>

      {/* Bảng theo hạng mục */}
      <div className="md:col-span-7 md:pt-24">
        <div
          aria-hidden
          className="hidden sm:grid grid-cols-[3rem_1fr_5rem_7rem] gap-4 pb-4 border-b border-ink-700
                     text-[11px] uppercase tracking-[0.18em] text-ink-400"
        >
          <span />
          <span>Hạng mục</span>
          <span className="text-right">Số lần</span>
          <span className="text-right">Năm</span>
        </div>

        <ul>
          {items.map((item, i) => (
            <li key={item.label}>
              <Reveal y={12} delay={i * 0.06}>
                <div
                  className="group relative isolate grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_7rem]
                             items-baseline gap-4 py-6 border-b border-ink-700"
                >
                  {/* Nền dâng từ dưới lên khi hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-ink-800 origin-bottom scale-y-0
                               group-hover:scale-y-100 transition-transform duration-500 ease-editorial"
                  />

                  <span className="text-xs text-ink-400 tnum pl-2">{pad(i + 1)}</span>

                  <div>
                    <p
                      className="text-lg text-ink-100 group-hover:text-white group-hover:translate-x-2
                                 transition-[color,transform] duration-500 ease-editorial"
                    >
                      {item.label}
                    </p>
                    {/* Vạch tỉ lệ so với tổng */}
                    <div className="relative h-px mt-3 bg-ink-700 overflow-hidden">
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-secondary-400 origin-left"
                        style={{ width: `${(item.count / total) * 100}%` }}
                        initial={reduced ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>

                  <span className="font-display text-2xl text-white tnum text-right">
                    {pad(item.count)}
                  </span>
                  <span className="hidden sm:block text-sm text-ink-400 tnum text-right pr-2">
                    {item.years}
                  </span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
