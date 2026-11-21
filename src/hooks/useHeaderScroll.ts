import { useEffect, type RefObject } from 'react'

/** Cuộn quá mốc này (px) thì header có trạng thái "đã cuộn" (data-scrolled: viên logo hiện kính, bóng đậm hơn) */
const SCROLLED_AT = 40
/** Cuộn xuống quá mốc này (px) mới thu nhỏ; về gần đầu trang (dưới mốc) thì luôn mở rộng */
const COMPACT_AT = 80
/** Cuộn ít hơn chừng này (px) giữa hai lần xét thì bỏ qua — tránh giật vì rung tay */
const DELTA = 6
/** Dải trên cùng màn hình (px): chuột bước vào đây (hoặc vào header) thì mở rộng header đang thu nhỏ */
const HOVER_ZONE = 80
/** Chuột rời header mà người dùng vẫn đang ở dưới (hướng cuộn cuối = xuống) → đợi chừng này rồi thu nhỏ lại */
const LEAVE_MS = 400
/** Mới vào trang chủ: trang tự cuộn tới banner — khoảng này không thu nhỏ header */
const SETTLE_MS = 900
/** Thao tác cuộn của người dùng (lăn chuột / vuốt / phím) còn "mới" trong khoảng này (ms) */
const INPUT_MS = 450
/** Cuộn lên không do người dùng (trang tự căn, vd. bộ ảnh /viec-lam kéo lùi ~30px) chỉ tính khi lớn hơn mức này (kéo thanh cuộn) */
const PROGRAMMATIC_UP = 160

/**
 * Header công khai thu nhỏ thay vì ẩn (chủ dự án 2026-11-21, thay quy tắc ẩn khi cuộn xuống của 16/11).
 * Chỉ ghi data-attribute (không setState) nên cuộn không làm React render lại:
 *   - header[data-scrolled]        cuộn quá 40px
 *   - html[data-header-compact]    đang ở trạng thái thu nhỏ (CSS: các cụm scale ~0,86 + nhích lên)
 *
 * Máy trạng thái (expanded ⇄ compact):
 *   cuộn xuống (> 6px) và đã quá 80px           → compact   (kể cả khi chuột đang nằm yên trên header)
 *   NGƯỜI DÙNG cuộn lên (> 6px) hoặc về gần đầu (< 80px) → expanded (trang tự kéo lùi ngắn, vd. căn ảnh, không tính)
 *   chuột BƯỚC VÀO header / dải 80px trên cùng   → expanded   (chuột chỉ nằm yên thì không kéo lại)
 *   chuột rời header + hướng cuối là xuống + > 80px → compact sau 400ms
 *   đổi route                                    → expanded, hướng cuộn xoá (tới lần cuộn xuống kế tiếp)
 *   focus BÀN PHÍM (:focus-visible) / menu xổ mở (aria-expanded=true) → expanded và không thu nhỏ
 * Chỉ :focus-visible mới tính — bấm chuột vào logo/link để lại focus trong header, tính cả nó thì header
 * không bao giờ thu nhỏ nữa (lỗi cũ). Trang chủ: ở màn mở đầu (html[data-header='hero']) luôn mở rộng,
 * phần ẩn/hiện logo+menu ở đó do IntroHero/useHomeHeader + CSS lo.
 * `routeKey` (pathname) đổi → khởi tạo lại (trang mới luôn bắt đầu mở rộng).
 */
export function useHeaderScroll(ref: RefObject<HTMLElement | null>, routeKey: string, enabled = true) {
  useEffect(() => {
    const header = ref.current
    if (!enabled || !header) return
    const html = document.documentElement
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let lastY = window.scrollY
    let dir: 'down' | 'up' | null = null
    let inside = false
    let frame = 0
    let timer = 0
    const settleUntil = routeKey === '/' ? performance.now() + SETTLE_MS : 0
    // Hướng thao tác cuộn gần nhất của NGƯỜI DÙNG — để phân biệt với trang tự cuộn (căn ảnh, scrollTo)
    let inputDir: 'down' | 'up' | null = null
    let inputAt = 0
    let touchY = 0
    const markInput = (d: 'down' | 'up') => {
      inputDir = d
      inputAt = performance.now()
    }
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY) markInput(e.deltaY > 0 ? 'down' : 'up')
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY
      if (Math.abs(y - touchY) > 2) markInput(y < touchY ? 'down' : 'up')
      touchY = y
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key) || (e.key === ' ' && e.shiftKey)) markInput('up')
      else if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key)) markInput('down')
    }
    const userUp = (dy: number) => (inputDir === 'up' && performance.now() - inputAt < INPUT_MS) || dy > PROGRAMMATIC_UP

    const busy = () => !!header.querySelector(':focus-visible, [aria-expanded="true"]')
    const setCompact = (on: boolean) => {
      if (on) html.dataset.headerCompact = ''
      else delete html.dataset.headerCompact
    }
    const clearTimer = () => {
      window.clearTimeout(timer)
      timer = 0
    }

    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y > SCROLLED_AT) header.setAttribute('data-scrolled', '')
      else header.removeAttribute('data-scrolled')

      if (html.dataset.header === 'hero' || y <= COMPACT_AT) {
        // Màn mở đầu trang chủ / gần đầu trang: luôn mở rộng
        clearTimer()
        setCompact(false)
        dir = y > lastY ? 'down' : dir
        lastY = y
        return
      }
      if (y - lastY > DELTA) {
        dir = 'down'
        clearTimer()
        if (performance.now() >= settleUntil && !busy()) setCompact(true)
      } else if (lastY - y > DELTA) {
        // Trang tự kéo lùi một đoạn ngắn (không phải người dùng cuộn lên) → bỏ qua, giữ trạng thái
        if (!userUp(lastY - y)) {
          lastY = y
          return
        }
        dir = 'up'
        clearTimer()
        setCompact(false)
      } else return
      lastY = y
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // Chuột: chỉ phản ứng khi đổi trạng thái trong/ngoài (bước vào / rời), không phải khi nằm yên
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const now = e.clientY <= HOVER_ZONE || header.matches(':hover')
      if (now === inside) return
      inside = now
      clearTimer()
      if (inside) setCompact(false)
      else scheduleRecompact()
    }
    const onLeaveWindow = () => {
      if (!inside) return
      inside = false
      scheduleRecompact()
    }
    function scheduleRecompact() {
      if (dir !== 'down') return
      timer = window.setTimeout(() => {
        timer = 0
        if (!inside && dir === 'down' && window.scrollY > COMPACT_AT && html.dataset.header !== 'hero' && !busy()) setCompact(true)
      }, LEAVE_MS)
    }

    // Tab vào header (bàn phím) hoặc mở menu xổ → mở rộng. Bấm chuột không tính (không :focus-visible)
    const onFocusIn = () => {
      if (busy()) setCompact(false)
    }
    const mo = new MutationObserver(() => {
      if (busy()) setCompact(false)
    })
    mo.observe(header, { attributes: true, attributeFilter: ['aria-expanded'], subtree: true })

    setCompact(false) // trang mới / vừa khởi tạo: bắt đầu mở rộng
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    header.addEventListener('focusin', onFocusIn)
    if (finePointer) {
      window.addEventListener('pointermove', onMove, { passive: true })
      html.addEventListener('pointerleave', onLeaveWindow)
    }
    return () => {
      cancelAnimationFrame(frame)
      clearTimer()
      mo.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMove)
      html.removeEventListener('pointerleave', onLeaveWindow)
      header.removeEventListener('focusin', onFocusIn)
      header.removeAttribute('data-scrolled')
      delete html.dataset.headerCompact
    }
  }, [ref, routeKey, enabled])
}
