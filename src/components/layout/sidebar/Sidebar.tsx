import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Briefcase, ChevronDown, ChevronLeft, Search, X } from 'lucide-react'
import { useMessengerStore } from '@context/messengerStore'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { SIDEBAR_CONFIG, isItemActive, normalize, type SidebarChild, type SidebarItem, type SidebarRole } from './config'
import { useSidebarBadges } from './useSidebarBadges'
import { useLiquid } from './useLiquid'
import { useSidebarCollapsed } from './useSidebarCollapsed'
import { useSidebarTip } from './SidebarTip'
import SidebarUser from './SidebarUser'
import SidebarGlassFooter from './SidebarGlassFooter'

type Props = {
  role: SidebarRole
  /** desktop = thanh nổi thu gọn được (md+); drawer = bản trong ngăn kéo mobile */
  variant: 'desktop' | 'drawer'
  /** Đóng ngăn kéo (drawer) / báo đã điều hướng */
  onClose?: () => void
  /** Bản kính xanh của dashboard người tìm việc: bỏ logo (đã có trên header), chân là thẻ lịch rảnh + Đăng xuất */
  glass?: boolean
}

// Hiện/ẩn chữ khi thu gọn: mờ đi rồi mới ẩn; khi mở rộng chờ thanh nở bớt rồi mới hiện
const FADE = 'transition-[opacity,visibility] duration-200 motion-reduce:transition-none'
const fade = (collapsed: boolean) => cn(FADE, collapsed ? 'invisible opacity-0' : 'visible opacity-100 delay-150')

const ROW =
  'relative z-[1] flex h-10 w-full items-center rounded-[14px] pl-[15px] pr-3 text-sm font-medium text-page-muted transition-colors duration-fast hover:text-page-fg motion-reduce:transition-none'

const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform)
const SHORTCUT = isMac ? '⌘K' : 'Ctrl K'

type FinderEntry = { id: string; label: string; sub?: string; item: SidebarItem; child?: SidebarChild }

/** Cuộn mượt tới phần tử có id (đợi trang đích tải xong, tối đa ~2 giây); giảm chuyển động thì nhảy thẳng. */
function scrollToId(id: string, reduced: boolean) {
  let tries = 0
  const go = () => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    else if (++tries < 40) window.setTimeout(go, 50)
  }
  window.setTimeout(go, 0)
}

export default function Sidebar({ role, variant, onClose, glass = false }: Props) {
  const config = SIDEBAR_CONFIG[role]
  const isDrawer = variant === 'drawer'
  const [storedCollapsed, setCollapsed] = useSidebarCollapsed()
  const collapsed = !isDrawer && storedCollapsed
  const reduced = useReducedMotion()
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const openMessenger = useMessengerStore((s) => s.openMessenger)
  const badges = useSidebarBadges(role)
  const tip = useSidebarTip(collapsed)

  const rootRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef(new Map<string, HTMLElement>())
  const reg = (key: string) => (el: HTMLElement | null) => {
    if (el) rowsRef.current.set(key, el)
    else rowsRef.current.delete(key)
  }

  // Hàng đang chọn
  const activeKey = useMemo(() => {
    for (const g of config.groups)
      for (const it of g.items) if (it.href && isItemActive(pathname, it.href.split('#')[0], config.homeHref)) return it.key
    return null
  }, [config, pathname])

  const active = useLiquid(contentRef, rowsRef, reduced, 1)
  const hover = useLiquid(contentRef, rowsRef, reduced, 0.5)
  useLayoutEffect(() => {
    active.setTarget(activeKey)
  }, [activeKey, active.setTarget])
  const onHover = (key: string) => hover.setTarget(key === activeKey ? null : key)

  // Nhóm con (Hồ sơ của tôi)
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(activeKey ? [activeKey] : []))
  const toggleKey = (key: string) =>
    setOpenKeys((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  const finish = () => onClose?.()
  const goHash = (href: string) => {
    const id = href.split('#')[1]
    if (id) scrollToId(id, reduced)
    finish()
  }

  // ─── Tìm trang (⌘K) ────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [focusIn, setFocusIn] = useState(false)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const entries = useMemo<FinderEntry[]>(
    () =>
      config.groups.flatMap((g) =>
        g.items.flatMap((item) => [
          { id: item.key, label: item.label, item },
          ...(item.children ?? []).map((child) => ({ id: `${item.key}/${child.href}`, label: child.label, sub: item.label, item, child })),
        ]),
      ),
    [config],
  )
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return entries.filter((e) => normalize(`${e.label} ${e.sub ?? ''}`).includes(q))
  }, [entries, query])
  useEffect(() => setCursor(0), [query])

  const focusSearch = () => {
    if (collapsed) setCollapsed(false)
    // Chờ ô tìm hiện (hết visibility:hidden) rồi mới focus
    requestAnimationFrame(() => requestAnimationFrame(() => inputRef.current?.focus()))
  }

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      // Chỉ bản đang hiện trên màn hình xử lý
      const root = rootRef.current
      if (!root || root.getClientRects().length === 0 || getComputedStyle(root).visibility === 'hidden') return
      e.preventDefault()
      focusSearch()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }) // chạy lại mỗi lần render để focusSearch luôn thấy `collapsed` mới nhất

  const choose = (entry: FinderEntry) => {
    setQuery('')
    inputRef.current?.blur()
    if (entry.item.action === 'messages' && !entry.child) {
      openMessenger()
      return finish()
    }
    const href = entry.child?.href ?? entry.item.href
    if (!href) return
    navigate(href)
    goHash(href)
  }

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault()
      setCursor((c) => (c + 1) % results.length)
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault()
      setCursor((c) => (c - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault()
      choose(results[cursor])
    } else if (e.key === 'Escape') {
      // Có chữ → chỉ xóa; trống → rời ô. Không để Esc lan lên đóng ngăn kéo.
      e.preventDefault()
      e.stopPropagation()
      if (query) setQuery('')
      else inputRef.current?.blur()
    }
  }

  // ─── Hàng menu ─────────────────────────────────────────────────────────
  const renderBadge = (it: SidebarItem) => {
    if (!it.badge) return { aria: '', node: null, cornerDot: false }
    const n = badges[it.badge.kind]
    if (n <= 0) return { aria: '', node: null, cornerDot: false }
    const aria =
      it.badge.kind === 'messages' ? `, ${n} tin nhắn chưa đọc`
      : it.badge.kind === 'applications' ? `, ${n} đơn`
      : ', có lịch phỏng vấn'
    const node =
      it.badge.style === 'count' ? (
        <span aria-hidden="true" className={cn('ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-medium leading-none text-wm-ivory', fade(collapsed))}>
          {n > 99 ? '99+' : n}
        </span>
      ) : (
        <span aria-hidden="true" className={cn('ml-auto h-2 w-2 rounded-full bg-danger', fade(collapsed))} />
      )
    return { aria, node, cornerDot: true }
  }

  const renderItem = (it: SidebarItem) => {
    const Icon = it.icon
    const isActive = activeKey === it.key
    const { aria, node, cornerDot } = renderBadge(it)
    const inner = (
      <>
        <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        <span className={cn('ml-3 truncate', fade(collapsed))}>{it.label}</span>
        {node}
        {/* Thu gọn: huy hiệu thành chấm đỏ ở góc icon */}
        {cornerDot && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-[29px] top-[7px] h-2.5 w-2.5 rounded-full border-2 border-wm-ivory bg-danger',
              'transition-opacity duration-200 motion-reduce:transition-none',
              collapsed ? 'opacity-100 delay-150' : 'opacity-0',
            )}
          />
        )}
      </>
    )
    const common = {
      ref: reg(it.key),
      onPointerEnter: () => onHover(it.key),
      className: cn(ROW, isActive && 'text-page-fg', FOCUS),
      'aria-label': it.label + aria,
      ...tip.bind(it.label),
    }

    // Hồ sơ của tôi: nhãn là link, mũi tên mở/đóng nhóm con
    if (it.children && it.href) {
      const open = openKeys.has(it.key) && !collapsed
      const panelId = `${listId}-${it.key}`
      return (
        <li key={it.key}>
          <div ref={reg(it.key)} onPointerEnter={() => onHover(it.key)} className="relative">
            <Link
              to={it.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={it.label}
              className={cn(ROW, 'pr-11', isActive && 'text-page-fg', FOCUS)}
              onClick={finish}
              {...tip.bind(it.label)}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
              <span className={cn('ml-3 truncate', fade(collapsed))}>{it.label}</span>
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? 'Thu gọn' : 'Mở'} ${it.label}`}
              tabIndex={collapsed ? -1 : 0}
              onClick={() => toggleKey(it.key)}
              className={cn(
                'absolute right-1.5 top-1 z-[2] flex h-8 w-8 items-center justify-center rounded-full text-page-muted hover:text-page-fg',
                'transition-[opacity,visibility,color] duration-200 motion-reduce:transition-none',
                collapsed ? 'invisible opacity-0' : 'visible opacity-100 delay-150',
                FOCUS,
              )}
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-base ease-editorial motion-reduce:transition-none', open && 'rotate-180')} aria-hidden="true" />
            </button>
          </div>
          {/* Cao 0fr → 1fr: mở/đóng danh sách con (animate chiều cao theo yêu cầu thiết kế) */}
          <div
            id={panelId}
            className={cn(
              'grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-editorial motion-reduce:transition-none',
              open ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0',
            )}
          >
            <ul className="ml-[26px] min-h-0 overflow-hidden border-l border-page-line pl-2">
              {it.children.map((c, i) => {
                const [path, id] = c.href.split('#')
                const here = pathname === path && hash === `#${id}`
                return (
                  <li key={c.href}>
                    <Link
                      ref={reg(`${it.key}/${i}`)}
                      to={c.href}
                      tabIndex={open ? 0 : -1}
                      aria-current={here ? 'location' : undefined}
                      onPointerEnter={() => onHover(`${it.key}/${i}`)}
                      onClick={() => goHash(c.href)}
                      className={cn(
                        'relative z-[1] flex h-9 items-center gap-2.5 rounded-[12px] px-3 text-xs font-medium text-page-muted transition-colors duration-fast hover:text-page-fg motion-reduce:transition-none',
                        here && 'text-page-fg',
                        FOCUS,
                      )}
                    >
                      <span aria-hidden="true" className={cn('h-2 w-2 flex-shrink-0 rounded-full', c.dot)} />
                      {c.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </li>
      )
    }

    return (
      <li key={it.key}>
        {it.action === 'messages' ? (
          <button
            type="button"
            aria-haspopup="dialog"
            {...common}
            onClick={() => {
              openMessenger()
              finish()
            }}
          >
            {inner}
          </button>
        ) : (
          <Link to={it.href ?? '/'} aria-current={isActive ? 'page' : undefined} {...common} onClick={finish}>
            {inner}
          </Link>
        )}
      </li>
    )
  }

  const pillBase =
    'sb-pill pointer-events-none absolute top-0 z-0 opacity-0 transition-[opacity,left,right,border-radius] duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none'
  const pillShape = collapsed ? 'left-1 right-1 rounded-full' : 'left-0 right-0 rounded-[14px]'

  return (
    <aside
      ref={rootRef}
      aria-label="Thanh điều hướng"
      className={cn(
        'relative h-full flex-shrink-0',
        isDrawer ? 'w-[260px]' : 'transition-[width] duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
        !isDrawer && (collapsed ? 'w-[72px]' : 'w-[260px]'),
      )}
    >
      <div aria-hidden="true" className="sb-glass absolute inset-0 rounded-[28px]" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px]">
        {/* Logo cũ: Briefcase trong ô tròn + Workmate + phụ đề theo vai trò. Bản kính xanh trên desktop: header đã có logo */}
        {glass && !isDrawer ? <div aria-hidden="true" className="h-4 flex-shrink-0" /> : (
        <div className="flex h-[76px] flex-shrink-0 items-center px-4">
          <Link
            to={role === 'admin' ? config.homeHref : '/'}
            aria-label={role === 'admin' ? 'Về tổng quan quản trị' : 'Về trang chủ Workmate'}
            onClick={finish}
            {...tip.bind('Workmate')}
            className={cn('flex min-w-0 items-center rounded-full', FOCUS)}
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-page-fg text-page-bg">
              <Briefcase className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className={cn('ml-3 min-w-0', fade(collapsed))}>
              <span className="block truncate font-display text-base font-semibold leading-5 text-page-fg">Workmate</span>
              <span className="block truncate text-xs leading-4 text-page-muted">{config.subtitle}</span>
            </span>
          </Link>
          {isDrawer && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng menu"
              className={cn('ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-white/70', FOCUS)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        )}

        {/* Tìm trang */}
        <div
          className="relative z-20 mx-3 h-10 flex-shrink-0"
          onFocus={() => setFocusIn(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false)
          }}
        >
          <div className="relative h-10 rounded-[14px] border border-page-line bg-white/50 transition-colors duration-fast focus-within:border-page-edge">
            <Search className="pointer-events-none absolute left-[14px] top-[10px] h-[18px] w-[18px] text-page-muted" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={focusIn && !!query && !collapsed}
              aria-controls={listId}
              aria-activedescendant={results[cursor] ? `${listId}-o${cursor}` : undefined}
              aria-autocomplete="list"
              aria-label="Tìm trang"
              autoComplete="off"
              tabIndex={collapsed ? -1 : 0}
              placeholder="Tìm trang…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              className={cn(
                'h-full w-full rounded-[14px] bg-transparent pl-[42px] pr-14 text-sm font-medium text-page-fg placeholder:text-page-muted',
                fade(collapsed),
                FOCUS,
              )}
            />
            <kbd
              aria-hidden="true"
              className={cn('absolute right-2 top-[7px] rounded-md border border-page-line px-1.5 font-sans text-xs leading-5 text-page-muted', fade(collapsed))}
            >
              {SHORTCUT}
            </kbd>
            {/* Thu gọn: cả ô là nút kính lúp — bấm để mở rộng và gõ tìm */}
            {collapsed && (
              <button
                type="button"
                aria-label={`Tìm trang (${SHORTCUT})`}
                onClick={focusSearch}
                {...tip.bind('Tìm trang', SHORTCUT)}
                className={cn('absolute inset-0 rounded-[14px]', FOCUS)}
              />
            )}
          </div>

          {focusIn && !collapsed && query.trim() && (
            <div
              id={listId}
              role="listbox"
              aria-label="Kết quả tìm trang"
              onMouseDown={(e) => e.preventDefault()}
              className="sb-tip absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-[18px] p-1.5"
            >
              {results.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-page-muted">Không tìm thấy trang nào</p>
              ) : (
                results.map((r, i) => {
                  const Icon = r.item.icon
                  return (
                    <div
                      key={r.id}
                      id={`${listId}-o${i}`}
                      role="option"
                      aria-selected={i === cursor}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => choose(r)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 text-sm font-medium text-page-fg',
                        i === cursor && 'bg-white/80',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] flex-shrink-0 text-page-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate">{r.label}</span>
                        {r.sub && <span className="block truncate text-xs font-normal text-page-muted">{r.sub}</span>}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Menu */}
        <nav aria-label="Menu chính" onPointerLeave={() => hover.setTarget(null)} className="mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
          <div ref={contentRef} className="relative">
            <div ref={hover.pillRef} aria-hidden="true" className={cn(pillBase, pillShape)} />
            <div ref={active.pillRef} aria-hidden="true" className={cn(pillBase, pillShape)} />
            {config.groups.map((g, gi) => (
              <div key={g.label} className={cn(gi > 0 && 'mt-1')}>
                <div className="relative flex h-8 items-end px-[15px] pb-1">
                  <span className={cn('text-sm font-medium text-page-muted', fade(collapsed))}>{g.label}</span>
                  {/* Thu gọn: vạch ngăn ngắn thay nhãn nhóm */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute bottom-2 left-1/2 h-px w-5 -translate-x-1/2 bg-page-line transition-opacity duration-200 motion-reduce:transition-none',
                      collapsed ? 'opacity-100 delay-150' : 'opacity-0',
                    )}
                  />
                </div>
                <ul className="space-y-0.5">{g.items.map(renderItem)}</ul>
              </div>
            ))}
          </div>
        </nav>

        {glass ? (
          <SidebarGlassFooter role={role} collapsed={collapsed} onNavigate={finish} tip={(l) => tip.bind(l)} />
        ) : (
          <SidebarUser config={config} collapsed={collapsed} onNavigate={finish} tip={(l) => tip.bind(l)} />
        )}
      </div>

      {/* Nút thu gọn/mở rộng: tròn nhỏ ở mép phải phía trên, xoay 180° khi thu gọn */}
      {!isDrawer && (
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'sb-tip absolute -right-3 top-[32px] z-30 flex h-6 w-6 items-center justify-center rounded-full text-page-fg',
            'transition-transform duration-fast hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100',
            FOCUS,
          )}
        >
          <ChevronLeft
            className={cn('h-3.5 w-3.5 transition-transform duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none', collapsed && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}
      {tip.node}
    </aside>
  )
}
