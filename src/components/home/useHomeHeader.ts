import { useLayoutEffect } from 'react'

/** Chiều cao header (72px). Banner coi như đã qua khi mép dưới của nó lên tới đây. */
const HEADER_H = 72

/**
 * Header trang chủ theo vị trí cuộn. Chỉ ghi data-attribute lên <html>, phần hiển thị nằm ở index.css.
 *
 *   data-header="hero"   còn ở màn mở đầu (html[data-intro], logo chưa bay về góc) → chỉ logo + nút menu
 *   data-header="full"   đã qua màn mở đầu: đủ header. Mốc này trùng mốc nút nổi [data-floating]
 *                        hiện ra (cùng thuộc tính data-intro do IntroHero đặt), và KHÔNG phụ thuộc hướng cuộn.
 *
 * Việc thu nhỏ/mở rộng header khi cuộn (chủ dự án 2026-11-21, thay quy tắc ẩn) do useHeaderScroll lo cho mọi
 * trang kể cả trang chủ; hook này không còn ẩn header.
 *
 * useLayoutEffect: đặt trạng thái trước khi vẽ khung đầu, để nav không lóe lên rồi mới ẩn.
 */
export function useHomeHeader() {
  useLayoutEffect(() => {
    const html = document.documentElement
    const hero = document.querySelector<HTMLElement>('[data-home-hero]')
    if (!hero) return

    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const rect = hero.getBoundingClientRect()
      // "hero" hay "full" chỉ phụ thuộc đã qua màn mở đầu chưa (data-intro do IntroHero đặt/gỡ theo tiến trình
      // cuộn; y > 8 cho chế độ giảm chuyển động, vốn không có data-intro).
      const full = rect.bottom <= HEADER_H || (!html.hasAttribute('data-intro') && y > 8)
      html.dataset.header = full ? 'full' : 'hero'
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // IntroHero gỡ/đặt data-intro theo cuộn (có thể sau lượt rAF của ta) → theo dõi thuộc tính để header khớp mốc
    const observer = new MutationObserver(onScroll)
    observer.observe(html, { attributes: true, attributeFilter: ['data-intro'] })

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      delete html.dataset.header
    }
  }, [])
}
