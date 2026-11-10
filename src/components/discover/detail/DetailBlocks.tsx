import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import { photoSrcSet, photoUrl, type Photo } from '../types'

/** Khối chữ trong dòng nội dung — tự hiện khi cuộn tới. */
export function TextBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      <h2 className="font-display text-xl font-semibold leading-tight tracking-[-0.02em] md:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </Reveal>
  )
}

/** Ảnh lớn xen giữa các khối chữ. */
export function ImageBlock({ photo }: { photo: Photo }) {
  return (
    <Reveal>
      <img
        src={photoUrl(photo.id, 1400)}
        srcSet={photoSrcSet(photo.id)}
        sizes="(min-width: 1024px) 60vw, 92vw"
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] w-full rounded-control bg-page-surface object-cover"
      />
    </Reveal>
  )
}

/** Hàng tag bo tròn. */
/** `strong`: chip đậm kèm khóa — dùng cho mục bắt buộc. */
export function TagList({ items, strong = false }: { items: string[]; strong?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((e) => (
        <li
          key={e}
          className={
            strong
              ? 'inline-flex items-center gap-1.5 rounded-full border border-page-fg bg-page-fg px-3 py-1.5 text-sm text-page-bg'
              : 'rounded-full border border-page-line px-3 py-1.5 text-sm text-page-muted'
          }
        >
          {strong && <Lock className="h-3 w-3" aria-hidden="true" />}
          {e}
        </li>
      ))}
    </ul>
  )
}

/** Vòng tròn chữ viết tắt thay cho ảnh mặt người. */
export function Initials({ text }: { text: string }) {
  return (
    <span
      aria-hidden
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-page-surface font-display text-base font-semibold"
    >
      {text}
    </span>
  )
}
