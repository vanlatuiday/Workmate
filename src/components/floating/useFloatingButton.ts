// Logic dùng chung cho nút tròn nổi: kéo, bám mép trái/phải, lưu vị trí, tính toạ độ và gốc zoom của khung,
// và tránh đè lên các nút nổi khác (registry nhỏ chứa vị trí nghỉ của từng nút).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMediaQuery } from '@hooks/useMediaQuery'

export const FLOAT_SIZE = 56 // đường kính nút
const EDGE = 24 // khoảng cách tới mép trái/phải (vị trí lưu cũ sát mép cũng được kẹp lại vì x luôn tính từ EDGE)
const TOP = 72 // dưới header 4rem + chút đệm
const BOTTOM = 24 // cách mép dưới 24px (cả mobile)
const DRAG_THRESHOLD = 5 // px: di chuyển ít hơn thế vẫn coi là bấm
export const GAP = 12 // khoảng cách tối thiểu giữa hai nút cùng mép
// Dưới md (<768px): hai nút gom thành một cụm nhỏ, cố định góc dưới phải, không kéo được
export const COMPACT_QUERY = '(max-width: 767px)'
const COMPACT_SIZE = 48 // vẫn >= 44px vùng chạm
const COMPACT_GAP = 8
const COMPACT_EDGE = 16
const COMPACT_BOTTOM = 16
type Metrics = { size: number; gap: number }

/** Kích thước nút theo cỡ màn hình: desktop 56/12, mobile 48/8 */
export function useFloatMetrics() {
  const compact = useMediaQuery(COMPACT_QUERY)
  return { compact, size: compact ? COMPACT_SIZE : FLOAT_SIZE, gap: compact ? COMPACT_GAP : GAP }
}

// Chừa chỗ cuối trang cho cụm nút nổi (chỉ mobile, chỉ khi nút đang hiện): mỗi nút đăng ký chiều cao cần chừa,
// body.paddingBottom = giá trị lớn nhất. Không đụng file trang nào.
const reserves = new Map<string, number>()
let savedPadding: string | null = null
function applyReserve() {
  const max = Math.max(0, ...reserves.values())
  const body = document.body
  if (max > 0) {
    if (savedPadding === null) savedPadding = body.style.paddingBottom
    body.style.paddingBottom = `calc(${max}px + env(safe-area-inset-bottom))`
  } else if (savedPadding !== null) {
    body.style.paddingBottom = savedPadding
    savedPadding = null
  }
}
/** Đăng ký chừa `px` ở đáy trang khi `px > 0` (0 = không chừa) */
export function useFloatReserve(key: string, px: number) {
  useLayoutEffect(() => {
    if (px > 0) reserves.set(key, px)
    else reserves.delete(key)
    applyReserve()
    return () => {
      reserves.delete(key)
      applyReserve()
    }
  }, [key, px])
}
/** Chiều cao cụm cần chừa: đáy của nút cao nhất (vị trí y của nó) -> tới mép dưới + đệm */
export function floatReservePx(restY: number, viewportH: number) {
  return Math.max(0, viewportH - restY + 12)
}

export type FloatPos = { side: 'left' | 'right'; yRatio: number }

// prio: số nhỏ hơn = ưu tiên hơn (giữ chỗ), số lớn hơn nhường. Mặc định = rank; nút vừa được thả nhận prio âm mới nhất.
type Rest = { side: 'left' | 'right'; y: number; prio: number }
type PushReq = { side: 'left' | 'right'; y: number }
interface RestState {
  rests: Record<string, Rest>
  /** Yêu cầu "hãy nhường chỗ và lưu" gửi tới nút khác theo id */
  pushes: Record<string, PushReq>
  set: (key: string, r: Rest) => void
  remove: (key: string) => void
  push: (key: string, req: PushReq) => void
  clearPush: (key: string) => void
}
// Vị trí nghỉ (đã tránh chồng) của các nút nổi đang hiện
const useRestStore = create<RestState>()((set) => ({
  rests: {},
  pushes: {},
  set: (key, r) =>
    set((s) => {
      const cur = s.rests[key]
      if (cur && cur.side === r.side && cur.y === r.y && cur.prio === r.prio) return s
      return { rests: { ...s.rests, [key]: r } }
    }),
  remove: (key) =>
    set((s) => {
      if (!(key in s.rests) && !(key in s.pushes)) return s
      const rests = { ...s.rests }
      const pushes = { ...s.pushes }
      delete rests[key]
      delete pushes[key]
      return { rests, pushes }
    }),
  push: (key, req) => set((s) => ({ pushes: { ...s.pushes, [key]: req } })),
  clearPush: (key) =>
    set((s) => {
      if (!(key in s.pushes)) return s
      const pushes = { ...s.pushes }
      delete pushes[key]
      return { pushes }
    }),
}))

// Mỗi lần người dùng thả một nút, nút đó được prio âm mới hơn → luôn thắng nút thả trước
let dropSeq = 0

// Trả null khi chưa có vị trí lưu hợp lệ
function loadPos(key: string): FloatPos | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<FloatPos>
    if ((p.side === 'left' || p.side === 'right') && typeof p.yRatio === 'number' && Number.isFinite(p.yRatio)) {
      return { side: p.side, yRatio: Math.min(1, Math.max(0, p.yRatio)) }
    }
  } catch {
    /* localStorage bị chặn / JSON hỏng → dùng mặc định */
  }
  return null
}

function savePos(key: string, p: FloatPos) {
  try {
    localStorage.setItem(key, JSON.stringify(p))
  } catch {
    /* bỏ qua */
  }
}

const viewport = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight })
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const isFree = (side: Rest['side'], v: number, others: Rest[], m: Metrics) =>
  others.every((o) => o.side !== side || Math.abs(v - o.y) >= m.size + m.gap)

/**
 * Đẩy y ra khỏi vùng của các nút cùng mép (lên hoặc xuống, chọn bên gần nhất), vẫn trong [minY, maxY].
 * Không có chỗ trống nào trong vùng → về đầu mút của vùng xa nút kia hơn (có thể vẫn chưa đủ xa).
 */
function resolveY(side: Rest['side'], y: number, others: Rest[], minY: number, maxY: number, m: Metrics) {
  const same = others.filter((o) => o.side === side)
  const cy = clamp(y, minY, maxY)
  if (isFree(side, cy, same, m)) return cy
  const candidates = same
    .flatMap((o) => [o.y - m.size - m.gap, o.y + m.size + m.gap]) // lên trước, xuống sau: hòa thì ưu tiên lên
    .filter((v) => v >= minY && v <= maxY && isFree(side, v, same, m))
  if (candidates.length > 0) return candidates.reduce((best, v) => (Math.abs(v - cy) < Math.abs(best - cy) ? v : best))
  const gap = (v: number) => Math.min(...same.map((o) => Math.abs(v - o.y)))
  return gap(maxY) > gap(minY) ? maxY : minY // hòa → đầu trên
}

/** Chỗ hiển thị của nút nhường: cùng mép nếu đủ chỗ, vùng quá hẹp thì sang mép đối diện (chỉ hiển thị) */
function placeYield(side: Rest['side'], y: number, others: Rest[], minY: number, maxY: number, m: Metrics) {
  const ys = resolveY(side, y, others, minY, maxY, m)
  if (isFree(side, ys, others, m)) return { side, y: ys }
  const opp: Rest['side'] = side === 'left' ? 'right' : 'left'
  const yo = resolveY(opp, y, others, minY, maxY, m)
  if (isFree(opp, yo, others, m)) return { side: opp, y: yo }
  return { side, y: ys }
}

const toRatio = (y: number, minY: number, maxY: number) => (maxY > minY ? clamp((y - minY) / (maxY - minY), 0, 1) : 1)

type Options = {
  storageKey: string
  /** Vị trí mặc định khi chưa lưu */
  defaultPos: FloatPos
  /** Lệch dọc (px, âm = lên) so với defaultPos; CHỈ áp dụng khi chưa có vị trí lưu */
  defaultOffsetY?: number
  /** Khi không có thao tác kéo (tải trang, đổi cỡ cửa sổ, vị trí lưu trùng): rank cao hơn nhường nút rank thấp hơn (chỉ lúc hiển thị) */
  rank: number
  /** Khung đang mở: dùng để cập nhật gốc zoom */
  open: boolean
  /** Gọi khi bấm (không phải kéo) */
  onActivate: () => void
  launcherRef: RefObject<HTMLButtonElement>
  wrapRef: RefObject<HTMLDivElement>
  panelRef: RefObject<HTMLDivElement>
  /** Nút đang bị ẩn (vd chuông trong dashboard): không chừa chỗ cuối trang */
  hidden?: boolean
  /** Không chừa chỗ cuối trang (vd dashboard tự cuộn trong khung riêng) */
  noReserve?: boolean
}

export function useFloatingButton({ storageKey, defaultPos, rank, defaultOffsetY = 0, open, onActivate, launcherRef, wrapRef, panelRef, hidden = false, noReserve = false }: Options) {
  const { compact, size, gap } = useFloatMetrics()
  const m: Metrics = { size, gap }
  const edge = compact ? COMPACT_EDGE : EDGE
  const bottom = compact ? COMPACT_BOTTOM : BOTTOM
  // null = chưa có vị trí lưu → dùng defaultPos + defaultOffsetY
  const [storedPos, setPos] = useState<FloatPos | null>(() => loadPos(storageKey))
  // Mobile: cụm cố định, bỏ qua vị trí đã kéo (không xoá, quay lại desktop vẫn còn)
  const savedPos = compact ? null : storedPos
  const pos = savedPos ?? defaultPos
  // Chỉ bật khi vị trí đổi do thao tác kéo thả (thả tay / bị đẩy), tự tắt sau ~350ms
  const [animate, setAnimate] = useState(false)
  const animTimer = useRef<number | undefined>(undefined)
  const flashAnimate = () => {
    setAnimate(true)
    window.clearTimeout(animTimer.current)
    animTimer.current = window.setTimeout(() => setAnimate(false), 350)
  }
  useEffect(() => () => window.clearTimeout(animTimer.current), [])
  const [prio, setPrio] = useState(rank)
  const [vp, setVp] = useState(viewport)
  const [dragXY, setDragXY] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const dragXYRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  // Chỉ lấy các nút được ưu tiên hơn mình; useShallow → nút không phải nhường ai thì không re-render khi registry đổi
  const others = useRestStore(
    useShallow((s) =>
      Object.entries(s.rests)
        .filter(([k, r]) => k !== storageKey && r.prio < prio)
        .map(([, r]) => r),
    ),
  )
  const myPush = useRestStore((s) => s.pushes[storageKey])

  // Toạ độ nút: x theo mép, y theo tỉ lệ trong vùng cho phép → đổi cỡ cửa sổ là tự kẹp lại
  const minY = TOP
  const maxY = Math.max(minY, vp.h - size - bottom)
  const wantY = clamp(minY + pos.yRatio * (maxY - minY) + (savedPos ? 0 : defaultOffsetY), minY, maxY)
  const placed = useMemo(() => placeYield(pos.side, wantY, others, minY, maxY, m), [pos.side, wantY, others, minY, maxY, size, gap])
  const restSide = placed.side
  const restY = placed.y
  const restX = restSide === 'left' ? edge : vp.w - size - edge
  const x = dragXY?.x ?? restX
  const y = dragXY?.y ?? restY

  // Báo vị trí nghỉ cho các nút khác biết. useLayoutEffect: đăng ký trước khi vẽ → nút nhường không nháy đè lên nút kia lúc mount
  const setRest = useRestStore((s) => s.set)
  const removeRest = useRestStore((s) => s.remove)
  const pushOther = useRestStore((s) => s.push)
  const clearPush = useRestStore((s) => s.clearPush)
  useLayoutEffect(() => {
    setRest(storageKey, { side: restSide, y: restY, prio })
  }, [setRest, storageKey, restSide, restY, prio])
  useLayoutEffect(() => () => removeRest(storageKey), [removeRest, storageKey])

  // Nút khác vừa được thả đè lên mình → nhường (lên/xuống bên gần hơn) và lưu vị trí mới
  useEffect(() => {
    if (!myPush) return
    clearPush(storageKey)
    const req: Rest = { ...myPush, prio: Number.NEGATIVE_INFINITY }
    if (req.side !== restSide || isFree(restSide, restY, [req], m)) return
    const ny = resolveY(restSide, restY, [req], minY, maxY, m)
    const next: FloatPos = { side: restSide, yRatio: toRatio(ny, minY, maxY) }
    flashAnimate()
    setPos(next)
    savePos(storageKey, next)
  }, [myPush, clearPush, storageKey, restSide, restY, minY, maxY, size, gap])

  useEffect(() => {
    const onResize = () => setVp(viewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ---- Kéo nút ----
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || compact) return // mobile: không kéo
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: restX, oy: restY, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    d.moved = true
    const next = { x: clamp(d.ox + dx, 0, vp.w - size), y: clamp(d.oy + dy, minY, maxY) }
    dragXYRef.current = next
    setDragXY(next)
  }
  const endDrag = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d?.moved || !dragXYRef.current) return
    // Thả tay: bám mép gần nhất, ở lại đúng độ cao đã thả; nút kia (nếu đè) phải nhường và lưu vị trí mới
    const { x: dx, y: dy } = dragXYRef.current
    const side: FloatPos['side'] = dx + size / 2 < vp.w / 2 ? 'left' : 'right'
    const finalY = clamp(dy, minY, maxY)
    const next: FloatPos = { side, yRatio: toRatio(finalY, minY, maxY) }
    for (const [k, r] of Object.entries(useRestStore.getState().rests)) {
      if (k !== storageKey && r.side === side && Math.abs(r.y - finalY) < size + gap) pushOther(k, { side, y: finalY })
    }
    dragXYRef.current = null
    suppressClick.current = true
    window.setTimeout(() => (suppressClick.current = false), 80)
    setPrio(-++dropSeq) // vừa thả → thắng mọi nút thả trước và mọi rank
    flashAnimate()
    setPos(next)
    setDragXY(null)
    savePos(storageKey, next)
  }
  const onClick = () => {
    if (suppressClick.current) return
    onActivate()
  }

  // ---- Zoom từ nút: gốc biến đổi = tâm nút, tính theo hệ toạ độ của khung ----
  useLayoutEffect(() => {
    const panel = panelRef.current
    const wrap = wrapRef.current
    const btn = launcherRef.current
    if (!panel || !wrap || !btn) return
    const wr = wrap.getBoundingClientRect()
    const br = btn.getBoundingClientRect()
    const left = wr.left + (wr.width - panel.offsetWidth) / 2
    const top = wr.top + (wr.height - panel.offsetHeight) / 2
    panel.style.transformOrigin = `${br.left + br.width / 2 - left}px ${br.top + br.height / 2 - top}px`
  }, [open, pos, restX, restY, vp, launcherRef, wrapRef, panelRef])

  // Mobile: chừa chỗ cuối trang để cụm nút không che nội dung
  useFloatReserve(storageKey, compact && !hidden && !noReserve ? floatReservePx(restY, vp.h) : 0)

  return {
    x,
    y,
    compact,
    dragging: dragXY !== null,
    animate,
    buttonProps: { onClick, onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag },
  }
}
