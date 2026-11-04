import { useLayoutEffect } from 'react'

/** Chiều cao header (h-16). Banner coi như đã qua khi mép dưới của nó lên tới đây. */
const HEADER_H = 64
/** Cuộn ít hơn chừng này (px) giữa hai khung hình thì bỏ qua — tránh header giật vì rung tay. */
const DELTA = 6

/**
 * Header trang chủ theo vị trí cuộn. Chỉ ghi data-attribute lên <html>, phần hiển thị nằm ở index.css.
 *
 *   data-header="hero"   đang ở banner ([data-home-hero]) → chỉ logo + nút menu, banner nổi bật
 *   data-header="full"   đã qua banner, hoặc đang lướt lên trên banner → đủ header có nền
 *   data-header-hidden   (chỉ khi "full") đang cuộn xuống → header trượt khuất; cuộn lên → hiện lại
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
        // Còn thấy banner. Phần đầu khối hero là intro (lớp sticky đang ghim, logo bay về góc):
        // ở đó luôn chỉ logo. Từ chỗ banner hiện đủ trở xuống: lướt lên → đủ header, lướt xuống → chỉ logo.
        // (Lướt lên ngay tại chỗ banner hiện đủ thì IntroHero trôi về intro → không bật header.)
        delete html.dataset.headerHidden
        const pastIntro = -rect.top >= rect.height - window.innerHeight - 2
        if (!pastIntro || down || !html.dataset.header) html.dataset.header = 'hero'
        else if (up) html.dataset.header = 'full'
        else return // chưa đủ xa → giữ trạng thái và mốc cũ để cộng dồn
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

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    header?.addEventListener('focusin', onFocusIn)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      header?.removeEventListener('focusin', onFocusIn)
      delete html.dataset.header
      delete html.dataset.headerHidden
    }
  }, [])
}
