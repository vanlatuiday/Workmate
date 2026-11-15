import { useEffect, type RefObject } from 'react'

/** Chuột vào dải này ở mép trên màn hình (px) thì gọi header đang ẩn ra */
const PEEK_ZONE = 80

/**
 * Header đang ẩn (html[data-header-hidden], do cuộn xuống) → DI chuột lên sát mép trên là hiện lại.
 * Chỉ gọi ra khi chuột di chuyển vào dải này; KHÔNG chặn việc ẩn khi cuộn xuống — trước đây có chặn
 * ("chuột còn trên header thì không ẩn") nên bấm logo/link rồi lăn chuột ngay (chuột vẫn ở mép trên)
 * thì header không bao giờ ẩn. Quy tắc cố định: cuộn xuống luôn ẩn (DESIGN.md → Header).
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
      if (lastY >= 0 && lastY <= PEEK_ZONE) delete html.dataset.headerHidden
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      lastY = e.clientY
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [ref])
}
