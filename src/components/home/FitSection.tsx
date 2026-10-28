import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import { useHomeCopy } from './useAudience'
import { pad } from '@utils/format'

/** Section B — lợi ích chính, trình bày đơn giản để tạo nhịp nghỉ sau hero. */
export default function FitSection() {
  const { fit } = useHomeCopy()
  return (
    <section data-theme="ivory" className="shell py-section">
      <Reveal y={16}>
        <p className="eyebrow text-page-muted">
          <span className="w-8 h-px bg-page-line" />
          {fit.eyebrow}
        </p>
      </Reveal>

      <div className="grid md:grid-cols-12 gap-8 mt-8">
        <TextReveal
          text={fit.title}
          className="md:col-span-8 font-display text-display-md font-semibold text-page-fg max-w-[16ch]"
        />
        <Reveal delay={0.2} className="md:col-span-4 md:pt-4">
          <p className="text-page-muted leading-relaxed max-w-sm">
            {fit.lead}
          </p>
        </Reveal>
      </div>

      <ol className="grid md:grid-cols-3 gap-px bg-page-line border-y border-page-line mt-16 md:mt-24">
        {fit.items.map((item, i) => (
          <li key={item.title} className="bg-page-bg md:px-8 md:first:pl-0">
            <Reveal delay={i * 0.1} className="h-full py-10">
              <span className="text-xs text-page-muted tnum">{pad(i + 1)}</span>
              <h3 className="font-display text-2xl font-medium text-page-fg mt-6 leading-snug max-w-[20ch]">
                {item.title}
              </h3>
              <p className="text-sm text-page-muted mt-4 leading-relaxed max-w-xs">{item.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}
