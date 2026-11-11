import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_PRIMARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'
import { formatHourlyFromK } from '@utils/format'
import { DISTRICTS, EMPTY_FILTERS, hasFilters, type JobFilters } from './catalog'

const SALARY_STEPS = [25, 30, 35, 40]
/** Header trang thường cao 4rem + viền 1px */
const HEADER_PX = 65

/** Số điều kiện lọc đang bật (hiện trên viên thu gọn) */
const countFilters = (f: JobFilters) => [f.q, f.district, f.type, f.minSalaryK, f.nearMe].filter(Boolean).length

type Props = {
  filters: JobFilters
  onChange: (next: JobFilters) => void
  /** "Gần tôi" cần hồ sơ có địa chỉ nên chỉ hiện cho người tìm việc */
  showNearMe?: boolean
  /** Tin của nhà tuyển dụng không có quận/lương dạng số → ẩn ô khu vực và chip lương */
  showDistrict?: boolean
  showSalary?: boolean
  placeholder?: string
}

/**
 * Thanh tìm kiếm dạng viên thuốc ở đầu trang Việc làm + hàng chip lọc nhanh.
 * Trạng thái nằm trong URL (do trang cha giữ); riêng ô gõ chữ có bản nháp cục bộ và đẩy lên URL
 * sau ~250ms để không ghi URL mỗi phím (bấm "Tìm việc"/Enter thì đẩy ngay).
 * Cuộn quá thanh này rồi lướt lên → hiện viên thu gọn dính dưới header (lướt xuống thì ẩn);
 * bấm viên → thanh đầy đủ bung ra tại chỗ trên lớp kính mờ (Esc / bấm ra ngoài / lướt xuống để thu lại).
 */
export default function JobSearchBar({
  filters,
  onChange,
  showNearMe = false,
  showDistrict = true,
  showSalary = true,
  placeholder = 'Vị trí, công ty, kỹ năng…',
}: Props) {
  const id = useId()
  const [text, setText] = useState(filters.q)
  const [collapsed, setCollapsed] = useState(false)
  /** Đang lướt lên — viên thu gọn chỉ hiện khi lướt lên, lướt xuống thì ẩn cho thoáng */
  const [scrollingUp, setScrollingUp] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Giữ bản mới nhất để timer debounce không dùng bộ lọc cũ
  const latest = useRef({ filters, onChange })
  latest.current = { filters, onChange }

  // Giá trị q mà chính thanh này vừa đẩy lên URL — để phân biệt với thay đổi đến từ bên ngoài
  const pushed = useRef(filters.q)
  const push = (q: string) => {
    pushed.current = q
    latest.current.onChange({ ...latest.current.filters, q })
  }

  useEffect(() => {
    if (text.trim() === latest.current.filters.q) return
    const t = window.setTimeout(() => push(text.trim()), 250)
    return () => window.clearTimeout(t)
  }, [text])

  // URL đổi từ nơi khác (nút "Xóa lọc" ở trạng thái rỗng, nút Back) → đồng bộ lại ô gõ.
  // Bỏ qua giá trị do chính thanh đẩy lên và lúc đang gõ (tránh mất ký tự / làm hỏng IME tiếng Việt).
  useEffect(() => {
    if (filters.q === pushed.current) return
    pushed.current = filters.q
    if (document.activeElement === inputRef.current) return
    setText(filters.q)
  }, [filters.q])

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

  // Hướng lướt lấy từ thao tác thật (bánh xe, vuốt, phím) chứ không từ sự kiện scroll —
  // vì bộ ảnh tự trôi về ảnh gần nhất sau khi dừng, cú trôi đó không được làm viên ẩn/hiện.
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
  // Viên đã bung thành thanh đầy đủ nổi dưới header (không cuộn trang)
  const [expanded, setExpanded] = useState(false)
  const showPill = collapsed && scrollingUp && !expanded
  const floatRef = useRef<HTMLDivElement>(null)
  const floatInputRef = useRef<HTMLInputElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)

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
      if (e.key !== 'Escape') return
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

  const set = (patch: Partial<JobFilters>) => onChange({ ...filters, ...patch })
  const clear = () => {
    setText('')
    pushed.current = ''
    onChange(EMPTY_FILTERS)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    push(text.trim())
    setExpanded(false)
  }

  const active = countFilters(filters)

  /** Thanh tìm kiếm + chip lọc. `floating`: bản nổi bung ra từ viên — kính mờ đậm hơn để chữ đọc được trên ảnh */
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
          <span className="sr-only">Tìm việc, công ty, kỹ năng</span>
          <input
            ref={floating ? floatInputRef : inputRef}
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-page-fg outline-none placeholder:text-page-muted"
          />
        </label>

        {showDistrict && (
          <>
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-page-line sm:block" />
            <div className="mx-4 h-px bg-page-line sm:hidden" aria-hidden="true" />

            {/* Khu vực: <select> gốc (giữ bàn phím/đọc màn hình), bỏ giao diện mặc định */}
            <label className="relative flex items-center gap-2 px-4 py-2.5 sm:w-44 sm:py-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
              <span className="sr-only">Khu vực</span>
              <select
                id={`${id}-district${floating ? '-float' : ''}`}
                value={filters.district}
                onChange={(e) => set({ district: e.target.value })}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm text-page-fg outline-none"
              >
                <option value="">Khu vực</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-page-muted" aria-hidden="true" />
            </label>
          </>
        )}

        <button
          type="submit"
          className={cn(BTN_PRIMARY, BTN_SM, 'mt-1 sm:mt-0')}
        >
          Tìm việc
        </button>
      </form>

      {/* Chip lọc nhanh: điện thoại cuộn ngang, từ sm xuống dòng và căn giữa */}
      <div
        role="group"
        aria-label="Lọc nhanh"
        className="-mx-6 mt-3 flex gap-1.5 overflow-x-auto px-6 pb-1 sm:mx-auto sm:max-w-4xl sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {JOB_TYPES.map((t) => (
          <Chip key={t.value} glass={floating} pressed={filters.type === t.value} onClick={() => set({ type: filters.type === t.value ? '' : t.value })}>
            {t.label}
          </Chip>
        ))}
        {showSalary && SALARY_STEPS.map((k) => (
          <Chip key={k} glass={floating} pressed={filters.minSalaryK === k} onClick={() => set({ minSalaryK: filters.minSalaryK === k ? 0 : k })}>
            {formatHourlyFromK(k).replace(/^t/, 'T')}
          </Chip>
        ))}
        {showNearMe && (
          <Chip glass={floating} pressed={filters.nearMe} onClick={() => set({ nearMe: !filters.nearMe })}>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Gần tôi
          </Chip>
        )}
        {hasFilters(filters) && (
          <button
            type="button"
            onClick={clear}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs text-page-fg underline underline-offset-4',
              floating && 'glass-liquid backdrop-blur-xl [--glass-alpha:70%]',
              FOCUS,
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Xóa lọc
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      <div ref={wrapRef} className="shell pb-2 pt-8 md:pt-10">
        {panel(false)}
      </div>

      {/* Viên thu gọn + thanh nổi: cùng một chỗ dưới header (điện thoại: đáy màn hình).
          Bấm viên → viên mờ đi, thanh đầy đủ bung ra tại chỗ (scale + opacity), không cuộn trang.
          Reduced motion → đổi trạng thái tức thì. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 lg:bottom-auto lg:top-[4.75rem] grid grid-cols-[minmax(0,1fr)] justify-items-center px-6">
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
            // Điện thoại: dịch trái, chừa chỗ nút chat nổi (24 + 56 + 12px) ở góc phải
            'max-w-[calc(100%-4.5rem)] justify-self-start sm:max-w-full sm:justify-self-center',
            'glass-liquid flex items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm text-page-fg [--glass-alpha:55%]',
            'transition-[opacity,transform] duration-fast ease-editorial motion-reduce:transition-none',
            showPill ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0 lg:-translate-y-2',
            FOCUS,
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-page-muted" aria-hidden="true" />
          <span className={cn('max-w-[12rem] truncate sm:max-w-[16rem]', !filters.q && 'text-page-muted')}>
            {filters.q || 'Tìm việc, công ty…'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-page-fg px-3 py-1 text-xs font-medium text-page-bg">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {active > 0 ? `${active} lọc` : 'Lọc'}
          </span>
        </button>

        <div
          ref={floatRef}
          aria-hidden={!expanded}
          className={cn(
            'col-start-1 row-start-1 w-full min-w-0 max-w-4xl self-end lg:self-start',
            'origin-bottom transition-[opacity,transform] duration-base ease-editorial motion-reduce:transition-none lg:origin-top',
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
function Chip({ pressed, onClick, glass = false, children }: { pressed: boolean; onClick: () => void; glass?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        CHIP,
        'shrink-0 px-3 py-1 text-xs',
        pressed ? CHIP_ON : CHIP_OFF,
        // Bản nổi trên ảnh: chip chưa chọn có nền kính để chữ đọc được
        glass && !pressed && 'glass-liquid backdrop-blur-xl [--glass-alpha:70%]',
      )}
    >
      {children}
    </button>
  )
}
