import { useEffect, type RefObject } from 'react'

/** Cuộn quá mốc này (px) thì header co lại + hiện nền kính */
const SCROLLED_AT = 80
/** Cuộn ít hơn chừng này (px) giữa hai khung hình thì bỏ qua — tránh giật vì rung tay */
const DELTA = 6

/**
 * Trạng thái cuộn của header (mọi trang công khai):
 *   - data-scrolled trên header khi cuộn quá 80px (CSS: co 72→60 + nền kính)
 *   - `hide` bật: cuộn xuống thì đặt html[data-header-hidden] (header trượt khuất), cuộn lên thì gỡ.
 *     Trang chủ truyền hide=false vì useHomeHeader đã lo việc này theo logic intro riêng.
 * Chỉ ghi data-attribute (không setState) nên cuộn không làm React render lại.
 * Đang dùng bàn phím trong header (hoặc menu con đang mở) thì không giấu nó.
 */
export function useHeaderScroll(ref: RefObject<HTMLElement | null>, hide: boolean, enabled = true) {
  useEffect(() => {
    const header = ref.current
    if (!enabled || !header) return
    const html = document.documentElement
    let lastY = window.scrollY
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y > SCROLLED_AT) header.setAttribute('data-scrolled', '')
      else header.removeAttribute('data-scrolled')

      if (!hide) {
        lastY = y
        return
      }
      if (y <= SCROLLED_AT) {
        delete html.dataset.headerHidden
      } else if (y - lastY > DELTA) {
        const busy = header.contains(document.activeElement) || header.querySelector('[aria-expanded="true"]')
        if (!busy) html.dataset.headerHidden = ''
      } else if (lastY - y > DELTA) {
        delete html.dataset.headerHidden
      } else return
      lastY = y
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // Tab vào header lúc nó đang khuất → hiện ra
    const onFocusIn = () => {
      if (hide) delete html.dataset.headerHidden
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    header.addEventListener('focusin', onFocusIn)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      header.removeEventListener('focusin', onFocusIn)
      header.removeAttribute('data-scrolled')
      if (hide) delete html.dataset.headerHidden
    }
  }, [ref, hide, enabled])
}
