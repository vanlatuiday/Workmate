import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@utils/cn'

type Tip = { label: string; kbd?: string; top: number; left: number; shown: boolean }

/**
 * Tooltip kính mờ bên phải cho thanh bên thu gọn: hiện khi rê chuột HOẶC focus bàn phím.
 * Vẽ bằng portal + vị trí fixed để không bị vùng cuộn của thanh bên cắt.
 * Chỉ transform/opacity: trượt ra 6px và mờ dần vào.
 */
export function useSidebarTip(enabled: boolean) {
  const [tip, setTip] = useState<Tip | null>(null)
  const timer = useRef<number>()

  const hide = useCallback(() => {
    window.clearTimeout(timer.current)
    setTip((t) => (t ? { ...t, shown: false } : t))
    timer.current = window.setTimeout(() => setTip(null), 160)
  }, [])

  const show = useCallback(
    (el: HTMLElement, label: string, kbd?: string) => {
      if (!enabled) return
      window.clearTimeout(timer.current)
      const r = el.getBoundingClientRect()
      setTip({ label, kbd, top: r.top + r.height / 2, left: r.right + 12, shown: false })
      requestAnimationFrame(() => setTip((t) => (t ? { ...t, shown: true } : t)))
    },
    [enabled],
  )

  // Thu gọn → mở rộng thì bỏ tooltip đang treo
  useEffect(() => {
    if (!enabled) setTip(null)
  }, [enabled])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const bind = (label: string, kbd?: string) => ({
    onMouseEnter: (e: MouseEvent<HTMLElement>) => show(e.currentTarget, label, kbd),
    onMouseLeave: hide,
    onFocus: (e: FocusEvent<HTMLElement>) => show(e.currentTarget, label, kbd),
    onBlur: hide,
  })

  const node = tip
    ? createPortal(
        <div
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-[75] -translate-y-1/2"
        >
          <div
            className={cn(
              'sb-tip theme-ivory flex items-center gap-2 whitespace-nowrap rounded-[12px] px-3 py-1.5 text-xs font-medium text-page-fg',
              'transition-[opacity,transform] duration-200 ease-editorial motion-reduce:transition-none',
              tip.shown ? 'translate-x-0 opacity-100' : '-translate-x-1.5 opacity-0 motion-reduce:translate-x-0',
            )}
          >
            {tip.label}
            {tip.kbd && <kbd className="rounded-md border border-page-line px-1.5 font-sans text-xs text-page-muted">{tip.kbd}</kbd>}
          </div>
        </div>,
        document.body,
      )
    : null

  return { bind, node }
}
