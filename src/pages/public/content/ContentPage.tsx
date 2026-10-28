// Khung chung cho các trang nội dung công khai (giới thiệu, hỗ trợ, điều khoản...).
// Trang yên tĩnh: chỉ dùng TextReveal / Reveal có sẵn.
import type { ReactNode } from 'react'
import TextReveal from '@components/motion/TextReveal'
import Reveal from '@components/motion/Reveal'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { FOCUS } from '@utils/focus'

/** Nút pill đặc / viền cho CTA trong trang nội dung */
export const CTA_PRIMARY = `inline-flex items-center justify-center rounded-full border border-page-fg bg-page-fg px-6 py-3 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg ${FOCUS}`
export const CTA_SECONDARY = `inline-flex items-center justify-center rounded-full border border-page-line px-6 py-3 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`

export default function ContentPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  children: ReactNode
}) {
  const enter = usePageEnterDelay()
  return (
    <section className="shell py-section-sm">
      <p className="eyebrow text-page-muted">
        <span className="h-px w-8 bg-page-line" aria-hidden="true" />
        {eyebrow}
      </p>
      <TextReveal
        as="h1"
        immediate
        delay={enter}
        text={title}
        className="mt-6 max-w-[22ch] font-display text-display-sm font-semibold text-page-fg"
      />
      {intro && (
        <Reveal immediate delay={enter + 0.25} y={16}>
          <p className="mt-4 max-w-2xl leading-relaxed text-page-muted">{intro}</p>
        </Reveal>
      )}
      <div className="mt-12 space-y-14">{children}</div>
    </section>
  )
}

/** Một mục: tiêu đề h2 + nội dung */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-page-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Đoạn văn dễ đọc */
export function ProseBlock({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl leading-relaxed text-page-muted">{children}</p>
}

/** Danh sách bước đánh số */
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-card border border-page-line p-6">
          <span className="text-xs font-medium text-page-muted">Bước {i + 1}</span>
          <h3 className="mt-2 font-display text-lg font-semibold text-page-fg">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-page-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  )
}

/** Hàng nút CTA */
export function CtaRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

