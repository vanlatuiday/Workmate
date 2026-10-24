import type { ReactNode } from 'react'
import Reveal from '@components/motion/Reveal'
import { photoSrcSet, photoUrl, type Photo } from '../types'

/** Khối chữ trong dòng nội dung — tự hiện khi cuộn tới. */
export function TextBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      <h2 className="font-display text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl">{title}</h2>
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
export function TagList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((e) => (
        <li key={e} className="rounded-full border border-page-line px-3 py-1.5 text-sm text-page-muted">
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
