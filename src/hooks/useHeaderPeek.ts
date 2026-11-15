import { useEffect, type RefObject } from 'react'

/** Chuột vào dải này ở mép trên màn hình (px) thì gọi header đang ẩn ra */
const PEEK_ZONE = 80

/**
 * Header đang ẩn (html[data-header-hidden], do cuộn xuống) → đưa chuột lên sát mép trên là hiện lại.
 * Chuột còn nằm trên header thì không cho ẩn: đặt html[data-header-hover] để hook cuộn bỏ qua lệnh ẩn.
 * Chỉ áp cho chuột/bút (có hover); màn cảm ứng vẫn dùng cuộn lên để gọi header.
 */
export function useHeaderPeek(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current
    if (!header || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const html = document.documentElement
    let frame = 0
    let lastY = -1

    const update = () => {
      frame = 0
      if (lastY >= 0 && lastY <= PEEK_ZONE) {
        delete html.dataset.headerHidden
        html.dataset.headerHover = ''
      } else if (!header.matches(':hover')) {
        delete html.dataset.headerHover
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      lastY = e.clientY
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onLeave = () => {
      lastY = -1
      delete html.dataset.headerHover
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      delete html.dataset.headerHover
    }
  }, [ref])
}
