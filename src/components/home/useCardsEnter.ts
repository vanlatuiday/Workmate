import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'

/**
 * Thẻ việc làm (`[data-job-card]` trong `scope`) hiện dần + trượt nhẹ lên, lần lượt, khi
 * cuộn tới — chỉ một lần. Trạng thái ẩn đặt từ JS nên JS lỗi thì thẻ vẫn thấy; tắt chuyển
 * động thì thẻ hiện sẵn. Hiệu ứng rê chuột (nhấc lên) nằm ở thẻ bên trong, không đụng
 * transform của phần tử này. `role` đổi (đăng nhập/xuất) → dựng lại cho bộ thẻ mới.
 */
export function useCardsEnter(scope: RefObject<HTMLElement>, count: number, role?: string) {
  const reduced = useReducedMotion()
  useGSAP(
    () => {
      if (reduced || !scope.current) return
      const cards = gsap.utils.toArray<HTMLElement>('[data-job-card]', scope.current)
      if (!cards.length) return
      gsap.set(cards, { opacity: 0, y: 28 })
      ScrollTrigger.batch(cards, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      })
    },
    // count: danh sách việc đổi (quản trị duyệt/ẩn tin) → dựng lại để thẻ mới cũng được xử lý
    { scope, dependencies: [reduced, count, role], revertOnUpdate: true },
  )
}
