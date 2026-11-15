import { useEffect, useState } from 'react'

export type Surface = 'light' | 'dark'

/** Chiều cao header (h-16). Đường dò nằm ngay dưới mép header. */
const HEADER_H = 64
/** Bề dày đường dò (px) — mỏng để chỉ khối thật sự nằm dưới header mới được tính */
const LINE = 2

/**
 * Header trang công khai (ngoài trang chủ) tự đổi sáng/tối theo KHỐI đang nằm dưới nó.
 *
 * Quy ước (DESIGN.md → Hai nền): khối đánh dấu `data-surface="dark"` hoặc `data-surface="light"`.
 * Khối nào nằm trên đường dò (dải 2px ngay dưới mép header) thì quyết định màu header; nhiều khối cùng
 * chạm đường dò (đúng lúc giao nhau) thì lấy khối đứng sau trong DOM. Không có khối nào đánh dấu → 'light'
 * (hành vi cũ: header ngà).
 *
 * Dùng IntersectionObserver, không đọc layout theo từng khung cuộn. Khối mới xuất hiện (trang tải theo nhu
 * cầu, đổi route) được bắt bằng MutationObserver trên <main>, gộp theo rAF. Trang chủ có logic riêng
 * (useHomeHeader / useSectionThemes) nên `enabled=false` ở đó.
 */
export function useHeaderSurface(enabled: boolean): Surface {
  const [surface, setSurface] = useState<Surface>('light')

  useEffect(() => {
    if (!enabled) {
      setSurface('light')
      return
    }
    const hits = new Set<HTMLElement>() // các khối đang chạm đường dò
    const seen = new Set<HTMLElement>() // các khối đang được theo dõi
    let io: IntersectionObserver | null = null
    let raf = 0

    const decide = () => {
      // Khối nằm sau cùng trong DOM thắng
      let top: HTMLElement | null = null
      for (const el of hits) {
        if (!top || top.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) top = el
      }
      setSurface(top?.dataset.surface === 'dark' ? 'dark' : 'light')
    }

    const build = () => {
      io?.disconnect()
      hits.clear()
      const bottom = Math.max(0, window.innerHeight - HEADER_H - LINE)
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) hits.add(e.target as HTMLElement)
            else hits.delete(e.target as HTMLElement)
          }
          decide()
        },
        { rootMargin: `-${HEADER_H}px 0px -${bottom}px 0px`, threshold: 0 },
      )
      seen.forEach((el) => io?.observe(el))
    }

    const scan = () => {
      raf = 0
      const now = new Set(document.querySelectorAll<HTMLElement>('main [data-surface]'))
      seen.forEach((el) => {
        if (!now.has(el)) {
          seen.delete(el)
          hits.delete(el)
          io?.unobserve(el)
        }
      })
      now.forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el)
          io?.observe(el)
        }
      })
      decide()
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(scan)
    }

    build()
    scan()
    const mo = new MutationObserver(schedule)
    const main = document.querySelector('main')
    if (main) mo.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-surface'] })
    const onResize = () => {
      build()
      decide()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      io?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [enabled])

  return surface
}
