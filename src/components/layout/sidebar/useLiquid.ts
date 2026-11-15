import { useCallback, useEffect, useRef, type RefObject } from 'react'

type Edge = { x: number; v: number; target: number; k: number; zeta: number }

const LEAD = { k: 460, zeta: 0.72 }
const TRAIL = { k: 150, zeta: 0.95 }
const MIN_H = 4

/**
 * Viên kính "lỏng": hai mép (trên/dưới) là hai lò xo riêng. Khi đổi hàng, mép phía đang đi tới
 * dùng lò xo cứng hơn (tới trước), mép còn lại tới trễ → viên kéo dãn phủ cả hai hàng rồi co lại.
 * Ghi thẳng vào style của phần tử (transform: translateY cho vị trí, height cho độ dài)
 * để không render lại React mỗi khung hình. Giảm chuyển động: nhảy tức thì.
 */
export function useLiquid(containerRef: RefObject<HTMLElement>, rowsRef: RefObject<Map<string, HTMLElement>>, reduced: boolean, maxOpacity: number) {
  const pillRef = useRef<HTMLDivElement>(null)
  const s = useRef({
    key: null as string | null,
    visible: false,
    top: { x: 0, v: 0, target: 0, ...TRAIL } as Edge,
    bottom: { x: 0, v: 0, target: 0, ...TRAIL } as Edge,
    raf: 0,
    last: 0,
  })

  const paint = () => {
    const el = pillRef.current
    if (!el) return
    const { top, bottom } = s.current
    const h = Math.max(MIN_H, bottom.x - top.x)
    el.style.transform = `translate3d(0, ${top.x}px, 0)`
    el.style.height = `${h}px`
  }

  const tick = useCallback((now: number) => {
    const st = s.current
    const dt = Math.min((now - st.last) / 1000, 1 / 30)
    st.last = now
    let moving = false
    for (const e of [st.top, st.bottom]) {
      const c = 2 * Math.sqrt(e.k) * e.zeta
      e.v += (-e.k * (e.x - e.target) - c * e.v) * dt
      e.x += e.v * dt
      if (Math.abs(e.x - e.target) < 0.15 && Math.abs(e.v) < 1) {
        e.x = e.target
        e.v = 0
      } else moving = true
    }
    paint()
    st.raf = moving ? requestAnimationFrame(tick) : 0
  }, [])

  const measure = () => {
    const st = s.current
    const row = st.key ? rowsRef.current?.get(st.key) : null
    const cont = containerRef.current
    if (!row || !cont) return null
    const t = row.getBoundingClientRect().top - cont.getBoundingClientRect().top
    return { t, b: t + row.offsetHeight }
  }

  /** Đặt lại đích theo hàng hiện tại (khi bố cục đổi). `animate` = dùng lò xo, không thì nhảy */
  const retarget = (directional: boolean) => {
    const st = s.current
    const m = measure()
    if (!m) return
    if (directional) {
      const movingDown = (m.t + m.b) / 2 > (st.top.x + st.bottom.x) / 2
      Object.assign(movingDown ? st.bottom : st.top, LEAD)
      Object.assign(movingDown ? st.top : st.bottom, TRAIL)
    }
    st.top.target = m.t
    st.bottom.target = m.b
    if (reduced || !st.visible) {
      st.top.x = m.t
      st.bottom.x = m.b
      st.top.v = st.bottom.v = 0
      paint()
      return
    }
    if (!st.raf) {
      st.last = performance.now()
      st.raf = requestAnimationFrame(tick)
    }
  }

  /** Chuyển viên kính tới hàng `key` (null = ẩn) */
  const setTarget = useCallback((key: string | null) => {
    const st = s.current
    const el = pillRef.current
    if (!el) return
    if (key === null) {
      st.visible = false
      el.style.opacity = '0'
      st.key = null
      return
    }
    const wasHidden = !st.visible
    st.key = key
    // Đang ẩn → đặt vị trí ngay rồi mới hiện, tránh trượt từ chỗ cũ
    if (wasHidden) {
      st.visible = false
      retarget(false)
      st.visible = true
      el.style.opacity = String(maxOpacity)
    } else retarget(true)
  }, [reduced, maxOpacity])

  // Bố cục đổi (mở nhóm con, đổi bề rộng, đổi cỡ chữ…) → bám theo hàng
  useEffect(() => {
    const cont = containerRef.current
    if (!cont || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      if (s.current.key) retarget(false)
    })
    ro.observe(cont)
    return () => ro.disconnect()
  }, [reduced])

  useEffect(() => () => cancelAnimationFrame(s.current.raf), [])

  return { pillRef, setTarget, refresh: () => s.current.key && retarget(false) }
}
