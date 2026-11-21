import { useEffect, useState } from 'react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

/** Mục lục dính bên trái (chỉ từ lg): chấm đặc = phần đã xong, viền = còn việc; phần đang xem được tô đậm. */
export default function SectionIndex({ sections, reduced }: { sections: { id: string; label: string; done: boolean }[]; reduced: boolean }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')

  // Phần đang xem: phần đầu tiên (theo thứ tự trang) đang nằm trong dải ngay dưới header
  useEffect(() => {
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id)
          else seen.delete(e.target.id)
        }
        const first = sections.find((s) => seen.has(s.id))
        if (first) setActive(first.id)
      },
      { rootMargin: '-96px 0px -55% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
    // danh sách phần cố định; chỉ trạng thái xong/chưa đổi
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <nav aria-label="Các phần của hồ sơ" className="hidden lg:sticky lg:top-24 lg:row-span-2 lg:block lg:self-start">
      <ul className="space-y-0.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); go(s.id) }}
              className={cn(
                'flex min-h-9 items-center gap-2.5 rounded-control px-2 text-sm transition-colors duration-fast motion-reduce:transition-none hover:text-page-fg',
                active === s.id ? 'font-medium text-page-fg' : 'text-page-muted',
                FOCUS,
              )}
            >
              <span aria-hidden className={cn('h-2.5 w-2.5 shrink-0 rounded-full border', s.done ? 'border-page-fg bg-page-fg' : 'border-page-edge')} />
              {s.label}
              <span className="sr-only">{s.done ? ', đã xong' : ', chưa xong'}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
