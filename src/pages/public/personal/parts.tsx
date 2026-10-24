import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { FOCUS } from '@utils/focus'

/** Mảnh giao diện dùng chung cho nội dung các tấm hồ sơ ở trang Cá nhân. */

/** Một nhóm nội dung trong tấm hồ sơ: tiêu đề nhỏ + thân */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{title}</h3>
      <div className="mt-2.5 text-base leading-relaxed">{children}</div>
    </section>
  )
}

/** Nhóm tag (kỹ năng, giá trị…) */
export function TagList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((t) => (
        <li key={t} className="rounded-full border border-page-line px-3 py-1 text-sm">
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Trạng thái chưa có dữ liệu; chủ sở hữu có lời mời bổ sung (`invite` = link) */
export function EmptyNote({ children, invite }: { children: ReactNode; invite?: { to: string; label: string } }) {
  return (
    <div className="rounded-card border border-dashed border-page-edge px-4 py-3 text-sm text-page-muted">
      <p>{children}</p>
      {invite && (
        <Link
          to={invite.to}
          className={`link-underline mt-1.5 inline-block rounded-control text-page-fg ${FOCUS}`}
        >
          {invite.label}
        </Link>
      )}
    </div>
  )
}

/** Danh sách có dấu gạch đầu dòng đơn giản */
export function PlainList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-page-edge" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Lưới tuần 7 ngày x 3 buổi. `on` = tập khóa "ngày-buổi" đang bật.
 * Mỗi ô có nhãn chữ cho trình đọc màn hình; màu chỉ là phần hiển thị.
 */
export function WeekGrid({ on, sample }: { on: ReadonlySet<string>; sample?: boolean }) {
  return (
    <div>
      <div role="table" aria-label={sample ? 'Lưới tuần ví dụ' : 'Lịch rảnh trong tuần'} className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-1.5 text-xs">
        <div role="row" className="contents">
          {/* Ô góc trống nhưng vẫn chiếm chỗ trong lưới (sr-only sẽ rời khỏi lưới làm lệch hàng) */}
          <span role="columnheader">
            <span className="sr-only">Buổi</span>
          </span>
          {DAY_SHORT.map((d) => (
            <span key={d} role="columnheader" className="text-center text-page-muted">{d}</span>
          ))}
        </div>
        {SESSIONS.map((s, si) => (
          <div key={s} role="row" className="contents">
            <span role="rowheader" className="self-center text-page-muted">{s}</span>
            {DAY_SHORT.map((d, di) => {
              const active = on.has(`${di}-${si}`)
              return (
                <span
                  key={d}
                  role="cell"
                  aria-label={`${d} ${s}: ${active ? 'rảnh' : 'không rảnh'}`}
                  className={`h-9 rounded-control border ${active ? 'border-page-fg bg-page-fg' : 'border-page-line bg-page-surface'}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-4 text-xs text-page-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-control border border-page-fg bg-page-fg" />
          {sample ? 'Buổi rảnh (ví dụ)' : 'Buổi rảnh'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-control border border-page-line bg-page-surface" />
          Chưa rảnh
        </span>
      </p>
    </div>
  )
}

/** Nút hành động cuối tấm hồ sơ (nền đặc / chỉ chữ) — link thường, không màn chuyển cảnh */
export { PrimaryLink as ActionPrimary, TextLink as ActionText } from '@components/discover/parts'

/** Ghi chú nhỏ dưới nút hành động */
export function ActionNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs text-page-muted">{children}</p>
}

/** Khối hành động: nút chính + link phụ cùng hàng */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-3">{children}</div>
}
