// Khung chung cho các trang nội dung công khai (giới thiệu, hỗ trợ, điều khoản...).
// Trang yên tĩnh: chỉ dùng TextReveal / Reveal có sẵn.
import type { ReactNode } from 'react'
import TextReveal from '@components/motion/TextReveal'
import Reveal from '@components/motion/Reveal'
import FadeIn from '@components/motion/FadeIn'
import { usePageEnterDelay } from '@components/motion/PageTransition'

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
    <FadeIn as="section">
      <h2 className="font-display text-xl font-semibold text-page-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </FadeIn>
  )
}

/** Đoạn văn dễ đọc */
export function ProseBlock({ children }: { children: ReactNode }) {
  return <p className="max-w-2xl leading-relaxed text-page-muted">{children}</p>
}

/** Hàng nút CTA */
export function CtaRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

