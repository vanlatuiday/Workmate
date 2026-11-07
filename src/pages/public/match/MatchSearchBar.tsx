import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Check, ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { LEVELS, type LevelKey } from './parts'

/** Header trang thường cao 4rem + viền 1px */
const HEADER_PX = 65

type Props = {
  query: string
  onQueryChange: (q: string) => void
  placeholder: string
  /** Nhãn ẩn của ô tìm (đọc màn hình) */
  searchLabel: string
  /** Ô phụ sau ô tìm (vd. ô chọn). `floating`: bản nổi — dùng để id không trùng */
  segments?: (floating: boolean) => ReactNode
  /** Nút đậm bên phải */
  action?: (floating: boolean) => ReactNode
  /** Hàng chip lọc nhanh bên dưới */
  chips?: (floating: boolean) => ReactNode
  /** Số điều kiện lọc đang bật (hiện trên viên thu gọn) */
  activeCount: number
}

/**
 * Thanh tìm kiếm dạng viên thuốc của trang Kết nối (cùng kiểu thanh ở trang Việc làm).
 * Lọc trực tiếp bằng state nên không cần debounce/URL; bấm Enter chỉ thu thanh nổi lại.
 * Cuộn quá thanh rồi lướt lên → viên thu gọn dính dưới header (điện thoại: đáy màn hình);
 * bấm viên → thanh đầy đủ bung ra tại chỗ (Esc / bấm ra ngoài / lướt xuống để thu lại).
 */
export default function MatchSearchBar({ query, onQueryChange, placeholder, searchLabel, segments, action, chips, activeCount }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)
  const floatInputRef = useRef<HTMLInputElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  /** Đang lướt lên — viên chỉ hiện khi lướt lên */
  const [scrollingUp, setScrollingUp] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const showPill = collapsed && scrollingUp && !expanded

  // Thanh đã trôi lên khuất sau header → bật viên thu gọn
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setCollapsed(!e.isIntersecting && e.boundingClientRect.top < HEADER_PX),
      { rootMargin: `-${HEADER_PX}px 0px 0px 0px` },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Hướng lướt lấy từ thao tác thật (bánh xe, vuốt, phím), không từ sự kiện scroll —
  // bộ ảnh tự trôi về ảnh gần nhất sau khi dừng, cú trôi đó không được làm viên ẩn/hiện.
  useEffect(() => {
    let touchY = 0
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 2) setScrollingUp(e.deltaY < 0)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - touchY
      if (Math.abs(dy) < 6) return
      setScrollingUp(dy > 0) // ngón tay kéo xuống = trang lướt lên
      touchY = e.touches[0].clientY
    }
    const onKey = (e: KeyboardEvent) => {
      // Gõ trong ô nhập/ô chọn (dấu cách, mũi tên) không phải là cuộn trang
      if ((e.target as HTMLElement).closest?.('input, select, textarea')) return
      if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) setScrollingUp(true)
      else if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key)) setScrollingUp(false)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Lướt xuống hoặc thanh gốc đã lộ lại → thu thanh nổi về
  useEffect(() => {
    if (!scrollingUp || !collapsed) setExpanded(false)
  }, [scrollingUp, collapsed])

  // Thanh nổi khi đóng: không nhận tab/chuột (React 18 chưa có prop `inert`)
  useEffect(() => {
    floatRef.current?.toggleAttribute('inert', !expanded)
  }, [expanded])

  // Thanh nổi đang mở: Esc hoặc bấm ra ngoài thì đóng
  useEffect(() => {
    if (!expanded) return
    floatInputRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      // Esc đã dùng để đóng menu lọc bên trong thì giữ thanh nổi
      if (e.key !== 'Escape' || e.defaultPrevented) return
      setExpanded(false)
      pillRef.current?.focus({ preventScroll: true })
    }
    const onDown = (e: PointerEvent) => {
      if (!floatRef.current?.contains(e.target as Node)) setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [expanded])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setExpanded(false)
  }

  /** Thanh tìm + chip. `floating`: bản nổi — kính mờ đậm hơn để chữ đọc được trên ảnh */
  const panel = (floating: boolean) => (
    <>
      <form
        role="search"
        onSubmit={submit}
        className={cn(
          'glass-liquid mx-auto flex max-w-2xl flex-col rounded-card p-1',
          floating ? 'backdrop-blur-xl [--glass-alpha:70%]' : '[--glass-alpha:45%]',
          'sm:flex-row sm:items-center sm:rounded-full',
          'focus-within:ring-2 focus-within:ring-page-fg focus-within:ring-offset-2 focus-within:ring-offset-page-bg',
        )}
      >
        <label className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 sm:py-1.5">
          <Search className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
          <span className="sr-only">{searchLabel}</span>
          <input
            ref={floating ? floatInputRef : undefined}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-page-fg outline-none placeholder:text-page-muted"
          />
        </label>

        {segments && (
          <>
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-page-line sm:block" />
            <div className="mx-4 h-px bg-page-line sm:hidden" aria-hidden="true" />
            {segments(floating)}
          </>
        )}

        {action && <div className="mt-1 flex sm:mt-0 [&>*]:flex-1 sm:[&>*]:flex-none">{action(floating)}</div>}
      </form>

      {/* Chip/menu lọc nhanh: xuống dòng và căn giữa (không cuộn ngang để menu không bị cắt) */}
      {chips && (
        <div
          role="group"
          aria-label="Lọc nhanh"
          className="mx-auto mt-3 flex max-w-4xl flex-wrap justify-center gap-1.5 overflow-visible"
        >
          {chips(floating)}
        </div>
      )}
    </>
  )

  return (
    <>
      <div ref={wrapRef} className="pb-4 pt-2">
        {panel(false)}
      </div>

      {/* Viên thu gọn + thanh nổi: cùng một chỗ dưới header (điện thoại: đáy màn hình).
          Reduced motion → đổi trạng thái tức thì. */}
      {/* Lớp phủ mờ sau thanh nổi để chip không đè lên nội dung trang (bấm vào thì đóng — do pointerdown bên ngoài) */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-30 bg-wm-charcoal/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none',
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* grid-cols-[minmax(0,1fr)]: hàng chip dài (nowrap) của thanh nổi không được nới cột rộng quá màn hình */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-[minmax(0,1fr)] justify-items-center px-6 lg:bottom-auto lg:top-[4.75rem]">
        <button
          ref={pillRef}
          type="button"
          onClick={() => setExpanded(true)}
          tabIndex={showPill ? 0 : -1}
          aria-hidden={!showPill}
          aria-expanded={expanded}
          aria-label="Mở thanh tìm kiếm và bộ lọc"
          className={cn(
            'col-start-1 row-start-1 self-end lg:self-start',
            'glass-liquid flex max-w-full items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm text-page-fg [--glass-alpha:55%]',
            'transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none',
            showPill ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0 lg:-translate-y-2',
            FOCUS,
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
          <span className={cn('max-w-[12rem] truncate sm:max-w-[16rem]', !query && 'text-page-muted')}>{query || placeholder}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-page-fg px-3 py-1 text-xs font-medium text-page-bg">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {activeCount > 0 ? `${activeCount} lọc` : 'Lọc'}
          </span>
        </button>

        <div
          ref={floatRef}
          aria-hidden={!expanded}
          className={cn(
            'col-start-1 row-start-1 w-full min-w-0 max-w-4xl self-end lg:self-start',
            'origin-bottom transition-[opacity,transform] duration-300 ease-editorial motion-reduce:transition-none lg:origin-top',
            expanded ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-[0.4] opacity-0',
          )}
        >
          {panel(true)}
        </div>
      </div>
    </>
  )
}

/** Chip lọc nhanh: bật/tắt, đang chọn thì tô đậm */
export function Chip({ pressed, onClick, glass = false, children }: { pressed: boolean; onClick: () => void; glass?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-300',
        pressed ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
        // Bản nổi trên ảnh: chip chưa chọn có nền kính để chữ đọc được
        glass && !pressed && 'glass-liquid backdrop-blur-xl [--glass-alpha:70%]',
        FOCUS,
      )}
    >
      {children}
    </button>
  )
}

/** Nút "Đặt lại" dạng chữ gạch chân cuối hàng chip */
export function ChipReset({ onClick, glass = false, children }: { onClick: () => void; glass?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs text-page-fg underline underline-offset-4',
        glass && 'glass-liquid backdrop-blur-xl [--glass-alpha:70%]',
        FOCUS,
      )}
    >
      {children}
    </button>
  )
}

/** Ô chọn gốc (giữ bàn phím/đọc màn hình) với icon + mũi tên, nền trong suốt */
export function BarSelect({
  icon,
  label,
  value,
  onChange,
  className,
  children,
}: {
  icon: ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <label className={cn('relative flex items-center gap-2 px-4 py-2.5 sm:py-1.5', className)}>
      <span className="shrink-0 text-page-muted" aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm text-page-fg outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-page-muted" aria-hidden="true" />
    </label>
  )
}

export type FilterOption = { value: string; label: string; count?: number }

/**
 * Nút lọc cỡ chip, bấm mở menu nhỏ bên dưới để chọn. `active`: giá trị khác mặc định → tô đậm.
 * Một lựa chọn: chọn xong đóng và trả focus; nhiều lựa chọn (`multiple`): giữ mở.
 * Bản nổi (`floating`) trên điện thoại nằm sát đáy màn hình nên menu mở lên trên.
 */
export function FilterMenu({
  label,
  options,
  selected,
  onSelect,
  multiple = false,
  active,
  glass = false,
  footer,
}: {
  label: string
  options: FilterOption[]
  /** Giá trị đang chọn (một lựa chọn: tối đa 1 phần tử) */
  selected: string[]
  onSelect: (value: string) => void
  multiple?: boolean
  active: boolean
  glass?: boolean
  footer?: { label: string; onClick: () => void }
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Menu tràn mép phải màn hình → căn theo mép phải của nút
  useLayoutEffect(() => {
    if (!open || !wrapRef.current || !popRef.current) return
    const left = wrapRef.current.getBoundingClientRect().left
    setAlignRight(left + popRef.current.offsetWidth > window.innerWidth - 16)
  }, [open])

  // Esc (bắt ở pha capture để thanh nổi không đóng theo) hoặc bấm ra ngoài thì đóng
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus({ preventScroll: true })
    }
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const pick = (value: string) => {
    onSelect(value)
    if (!multiple) {
      setOpen(false)
      triggerRef.current?.focus({ preventScroll: true })
    }
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors duration-300',
          active ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
          glass && !active && 'glass-liquid backdrop-blur-xl [--glass-alpha:70%]',
          FOCUS,
        )}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {/* Đóng: invisible (rút khỏi thứ tự Tab) + mờ đi */}
      <div
        ref={popRef}
        id={id}
        className={cn(
          'glass-liquid absolute z-40 min-w-[11rem] rounded-card p-1.5 text-left backdrop-blur-xl [--glass-alpha:85%]',
          glass ? 'bottom-full mb-2 origin-bottom lg:bottom-auto lg:top-full lg:mb-0 lg:mt-2 lg:origin-top' : 'top-full mt-2 origin-top',
          alignRight ? 'right-0' : 'left-0',
          'transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none',
          open ? 'visible scale-100 opacity-100' : 'invisible pointer-events-none scale-95 opacity-0',
        )}
      >
        <ul>
          {options.map((o) => {
            const on = selected.includes(o.value)
            return (
              <li key={o.value}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(o.value)}
                  className={cn(
                    'flex w-full items-center gap-2 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm text-page-fg transition-colors duration-300 hover:bg-page-surface',
                    on && 'font-medium',
                    FOCUS,
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5 shrink-0', !on && 'invisible')} aria-hidden="true" />
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="tnum ml-3 text-xs text-page-muted">{o.count}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        {footer && (
          <button
            type="button"
            onClick={footer.onClick}
            className={cn('mt-1 w-full rounded-control px-3 py-2 text-left text-xs text-page-muted underline underline-offset-4 hover:text-page-fg', FOCUS)}
          >
            {footer.label}
          </button>
        )}
      </div>
    </div>
  )
}

/** Menu lọc "Mức phù hợp" dùng chung cho hai vai trò. `scores`: điểm của cả danh sách đang xem (để đếm). */
export function LevelMenu({ scores, value, onChange, glass }: { scores: number[]; value: LevelKey; onChange: (v: LevelKey) => void; glass: boolean }) {
  // Mức không có mục nào thì ẩn, trừ mức đang chọn để còn đường quay lại
  const options = LEVELS.map((l) => ({ value: l.id, label: l.label, count: scores.filter(l.has).length }))
    .filter((o) => o.value === 'all' || o.count > 0 || o.value === value)
  const current = LEVELS.find((l) => l.id === value) ?? LEVELS[0]
  return (
    <FilterMenu
      glass={glass}
      label={value === 'all' ? 'Mức phù hợp' : `Mức: ${current.label}`}
      active={value !== 'all'}
      options={options}
      selected={[value]}
      onSelect={(v) => onChange(v as LevelKey)}
    />
  )
}
