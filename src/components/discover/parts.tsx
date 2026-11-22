import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import RollText from '@components/motion/RollText'
import { cn } from '@utils/cn'
import { CurtainLink } from '@components/motion/PageCurtain'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_PRIMARY } from '@utils/ui'

/** Mảnh giao diện nhỏ cho phần chữ của bộ sưu tập — giữ ba vai trò cùng một nhịp chữ. */


/** Danh sách cặp nhãn – giá trị. `dense`: bản gọn cho thẻ kính thấp ở /viec-lam */
export function Facts({ rows, dense = false }: { rows: [string, ReactNode][]; dense?: boolean }) {
  return (
    <dl className={cn('divide-y divide-page-line border-y border-page-line text-sm', dense ? 'mt-4' : 'mt-6')}>
      {rows.map(([k, v]) => (
        <div key={k} className={cn('flex justify-between gap-4', dense ? 'py-2' : 'py-2.5')}>
          <dt className="text-page-muted">{k}</dt>
          <dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Nút chính. Có `curtain` → đi qua màn chuyển cảnh, chữ trên màn là `curtain`. `accent` → màu nhấn (một nút chính mỗi màn hình). */
export function PrimaryLink({
  to,
  children,
  state,
  curtain,
  accent,
}: {
  to: string
  children: string
  state?: unknown
  curtain?: string
  accent?: boolean
}) {
  const Comp = curtain ? CurtainLink : Link
  return (
    <Comp
      to={to}
      title={curtain ?? ''}
      state={state}
      className={cn(accent ? BTN_ACCENT : BTN_PRIMARY, 'group')}
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

/** Ghi chú nhỏ cuối trang (nguồn ảnh…) */
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
