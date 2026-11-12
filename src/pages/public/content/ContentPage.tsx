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

/**
 * Danh sách bước đánh số: số tròn nổi bật + đường nối giữa các bước
 * (ngang ở desktop, dọc ở mobile).
 */
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 md:block">
          {/* Đường nối tới bước kế: dọc dưới số (mobile) / ngang bên phải số (desktop) */}
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-5 top-12 -bottom-8 w-px bg-page-line md:-bottom-auto md:left-14 md:right-[-1.5rem] md:top-5 md:h-px md:w-auto"
            />
          )}
          <span className="tnum relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-page-fg font-display text-base font-semibold text-page-bg">
            {i + 1}
          </span>
          <div className="md:mt-5">
            <h3 className="font-display text-lg font-semibold text-page-fg">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Hàng nút CTA */
export function CtaRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

