import { Link } from 'react-router-dom'
import { ArrowUpRight, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import RollText from '@components/motion/RollText'
import { cn } from '@utils/cn'
import { CurtainLink } from '@components/motion/PageCurtain'
import { FOCUS } from '@utils/focus'

/** Mảnh giao diện nhỏ cho phần chữ của bộ sưu tập — giữ ba vai trò cùng một nhịp chữ. */


export function GalleryIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <>
      <p className="eyebrow text-page-muted">
        <span className="h-px w-8 bg-page-line" />
        {eyebrow}
      </p>
      <h1 className="mt-5 max-w-[14ch] font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em]">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-page-muted">{text}</p>
    </>
  )
}

export function DetailHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{kicker}</p>
      <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.01em] md:text-2xl">{title}</h2>
    </>
  )
}

/** Danh sách cặp nhãn – giá trị */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-6 divide-y divide-page-line border-y border-page-line text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2.5">
          <dt className="text-page-muted">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Nút chính. Có `curtain` → đi qua màn chuyển cảnh, chữ trên màn là `curtain`. */
export function PrimaryLink({
  to,
  children,
  state,
  curtain,
}: {
  to: string
  children: string
  state?: unknown
  curtain?: string
}) {
  const Comp = curtain ? CurtainLink : Link
  return (
    <Comp
      to={to}
      title={curtain ?? ''}
      state={state}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full bg-page-fg px-6 py-3 text-sm font-medium text-page-bg transition-opacity duration-300 hover:opacity-90',
        FOCUS,
      )}
    >
      <RollText>{children}</RollText>
      <ArrowUpRight className="h-4 w-4" />
    </Comp>
  )
}

export function TextLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className={cn('link-underline rounded-control text-sm text-page-muted hover:text-page-fg', FOCUS)}>
      {children}
    </Link>
  )
}

/** Ghi chú dữ liệu mẫu — đặt cuối trang */
export function SampleNote({ children }: { children: ReactNode }) {
  return <p className="shell pb-section-sm text-xs text-page-muted">{children}</p>
}

/** Khối kết sau bộ sưu tập: một câu hỏi + hành động tiếp theo của vai trò */
export function ClosingBand({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="shell border-t border-page-line py-section-sm">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <h2 className="max-w-[18ch] font-display text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-page-muted">{text}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 md:col-span-5 md:justify-end">{children}</div>
      </div>
    </section>
  )
}

/**
 * Thẻ dẫn tới trang cá nhân của bên đang đăng tuyển / đang ứng tuyển.
 * Mở bằng màn phủ từ trên xuống, cùng hướng với nút "Trang cá nhân" ở header.
 */
export function ProfileTag({ to, children }: { to: string; children: string }) {
  return (
    <CurtainLink
      to={to}
      title="Trang cá nhân"
      direction="down"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-page-line px-3 py-1.5 text-xs text-page-muted transition-colors duration-300 hover:border-page-fg hover:text-page-fg',
        FOCUS,
      )}
    >
      <UserRound className="h-3.5 w-3.5" />
      {children}
    </CurtainLink>
  )
}
