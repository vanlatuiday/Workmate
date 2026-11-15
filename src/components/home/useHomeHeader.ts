import { useLayoutEffect } from 'react'

/** Chiều cao header (72px). Banner coi như đã qua khi mép dưới của nó lên tới đây. */
const HEADER_H = 72
/** Mới vào trang chủ (vd. bấm từ trang khác về): trang tự cuộn tới banner — khoảng này không giấu header */
const SETTLE_MS = 900
/** Header vừa hiện đủ (qua màn mở đầu) thì giữ thêm một đoạn cuộn rồi mới cho ẩn, tránh hiện rồi biến ngay */
const SHOW_FOR = 120
/** Cuộn ít hơn chừng này (px) giữa hai khung hình thì bỏ qua — tránh header giật vì rung tay. */
const DELTA = 6

/**
 * Header trang chủ theo vị trí cuộn. Chỉ ghi data-attribute lên <html>, phần hiển thị nằm ở index.css.
 *
 *   data-header="hero"   còn ở màn mở đầu (html[data-intro], logo chưa bay về góc) → chỉ logo + nút menu
 *   data-header="full"   đã qua màn mở đầu: đủ header có nền. Mốc này trùng mốc nút nổi [data-floating]
 *                        hiện ra (cùng thuộc tính data-intro do IntroHero đặt), và KHÔNG phụ thuộc hướng cuộn.
 *   data-header-hidden   (khi "full", kể cả đang trong banner — chủ dự án 2026-11-16) cuộn xuống → header trượt khuất;
 *                        cuộn lên → hiện lại. Mới vào trang (tự cuộn tới banner) thì header luôn hiện.
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
    const settleUntil = performance.now() + SETTLE_MS
    /** Vị trí cuộn lúc header chuyển sang "full" (null = đang ở màn mở đầu) */
    let fullAt: number | null = null

    const update = () => {
      frame = 0
      const y = window.scrollY
      const down = y - lastY > DELTA
      const up = lastY - y > DELTA
      const rect = hero.getBoundingClientRect()

      // Còn thấy khối banner: "hero" hay "full" chỉ phụ thuộc đã qua màn mở đầu chưa (data-intro do IntroHero
      // đặt/gỡ theo tiến trình cuộn; y > 8 cho chế độ giảm chuyển động, vốn không có data-intro).
      const full = rect.bottom <= HEADER_H || (!html.hasAttribute('data-intro') && y > 8)
      html.dataset.header = full ? 'full' : 'hero'
      if (!full) fullAt = null
      else if (fullAt === null) fullAt = y
      if (!full || performance.now() < settleUntil || y < (fullAt ?? 0) + SHOW_FOR) {
        // Màn mở đầu, hoặc vừa vào trang và đang tự cuộn tới banner: header luôn hiện
        delete html.dataset.headerHidden
      } else {
        // Đã qua màn mở đầu: cuộn xuống trượt khuất, cuộn lên hiện lại
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
