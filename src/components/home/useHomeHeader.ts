import { useLayoutEffect } from 'react'

/** Chiều cao header (h-16). Banner coi như đã qua khi mép dưới của nó lên tới đây. */
const HEADER_H = 64
/** Cuộn ít hơn chừng này (px) giữa hai khung hình thì bỏ qua — tránh header giật vì rung tay. */
const DELTA = 6

/**
 * Header trang chủ theo vị trí cuộn. Chỉ ghi data-attribute lên <html>, phần hiển thị nằm ở index.css.
 *
 *   data-header="hero"   còn ở màn mở đầu (html[data-intro], logo chưa bay về góc) → chỉ logo + nút menu
 *   data-header="full"   đã qua màn mở đầu: đủ header có nền. Mốc này trùng mốc nút nổi [data-floating]
 *                        hiện ra (cùng thuộc tính data-intro do IntroHero đặt), và KHÔNG phụ thuộc hướng cuộn.
 *   data-header-hidden   (chỉ khi "full" và banner đã trôi hẳn khỏi màn) cuộn xuống → header trượt khuất; cuộn lên → hiện lại
 *
 * Trước đây "hero" kéo dài tới tận khi mép dưới khối banner (cao 200svh) lên tới header — tức ~2000px — và
 * phụ thuộc hướng cuộn nên lướt lên ở y=1000 thì hiện, lướt xuống thì không.
 *
 * useLayoutEffect: đặt trạng thái trước khi vẽ khung đầu, để nav không lóe lên rồi mới ẩn.
 */
export function useHomeHeader() {
  useLayoutEffect(() => {
    const html = document.documentElement
    const hero = document.querySelector<HTMLElement>('[data-home-hero]')
    const header = document.querySelector<HTMLElement>('[data-site-header]')
    if (!hero) return

    let lastY = window.scrollY
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const down = y - lastY > DELTA
      const up = lastY - y > DELTA
      const rect = hero.getBoundingClientRect()

      if (rect.bottom > HEADER_H) {
        // Còn thấy khối banner: chỉ phụ thuộc đã qua màn mở đầu hay chưa (data-intro do IntroHero đặt/gỡ
        // theo tiến trình cuộn; y > 8 cho chế độ giảm chuyển động, vốn không có data-intro). Không ẩn header ở đây.
        delete html.dataset.headerHidden
        html.dataset.header = !html.hasAttribute('data-intro') && y > 8 ? 'full' : 'hero'
      } else {
        // Qua khỏi banner: cuộn xuống trượt khuất, cuộn lên hiện lại
        html.dataset.header = 'full'
        if (down) {
          // Đang dùng bàn phím trong header thì không giấu nó đi
          if (!header?.contains(document.activeElement)) html.dataset.headerHidden = ''
        } else if (up) delete html.dataset.headerHidden
        else return
      }
      lastY = y
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // Tab vào header lúc nó đang khuất → hiện ra
    const onFocusIn = () => {
      delete html.dataset.headerHidden
    }
    // IntroHero gỡ/đặt data-intro theo cuộn (có thể sau lượt rAF của ta) → theo dõi thuộc tính để header khớp mốc
    const observer = new MutationObserver(onScroll)
    observer.observe(html, { attributes: true, attributeFilter: ['data-intro'] })

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    header?.addEventListener('focusin', onFocusIn)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      header?.removeEventListener('focusin', onFocusIn)
      delete html.dataset.header
      delete html.dataset.headerHidden
    }
  }, [])
}
