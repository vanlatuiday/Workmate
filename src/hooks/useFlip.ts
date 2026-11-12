import { useLayoutEffect, useRef } from 'react'

/**
 * Danh sách sắp xếp lại mượt khi lọc / đổi thứ tự (kỹ thuật FLIP, Web Animations API — không cần thư viện):
 * thẻ còn lại trượt tới vị trí mới, thẻ mới hiện mờ dần. 300ms, ease-editorial. Giảm chuyển động: không chạy.
 *
 * Dùng: `const ref = useFlip(keys)` gắn `ref` lên phần tử cha của danh sách; mỗi con trực tiếp có
 * `data-flip-key={id}`. `keys` là mảng id theo thứ tự đang hiển thị (đổi mảng → chạy hiệu ứng).
 */
export function useFlip<T extends HTMLElement = HTMLElement>(keys: readonly string[]) {
  const ref = useRef<T>(null)
  const prev = useRef(new Map<string, DOMRect>())
  const signature = keys.join('|')

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const items = [...root.querySelectorAll<HTMLElement>(':scope > [data-flip-key]')]
    const next = new Map(items.map((el) => [el.dataset.flipKey!, el.getBoundingClientRect()]))
    const before = prev.current
    prev.current = next
    // Lần đầu render: chỉ ghi vị trí
    if (!before.size) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timing: KeyframeAnimationOptions = { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    for (const el of items) {
      const key = el.dataset.flipKey!
      const now = next.get(key)!
      const old = before.get(key)
      if (!old) {
        el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], timing)
        continue
      }
      const dx = old.left - now.left
      const dy = old.top - now.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], timing)
    }
  }, [signature])

  return ref
}
