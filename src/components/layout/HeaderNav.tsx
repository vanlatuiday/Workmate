import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { MenuItem } from '@components/layout/MenuOverlay'
import ExploreMenu, { EXPLORE_ITEMS } from '@components/layout/ExploreMenu'

const EXPLORE_KEY = '__explore'

/**
 * Menu giữa trong viên kính. Một viên nền "active" dùng chung (layoutId): nằm sau trang đang mở,
 * hover vào link khác thì trượt sang đó, rời chuột/focus thì trượt về trang hiện tại.
 */
export default function HeaderNav({ links, className }: { links: MenuItem[]; className?: string }) {
  const { pathname } = useLocation()
  const reduced = useReducedMotion()
  const [hover, setHover] = useState<string | null>(null)

  const exploreActive = EXPLORE_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  const activeKey = links.find((l) => l.href === pathname)?.href ?? (exploreActive ? EXPLORE_KEY : null)
  const target = hover ?? activeKey

  const pill = (key: string) =>
    target === key ? (
      <motion.span
        layoutId="hd-pill"
        aria-hidden="true"
        className="hd-pill"
        style={{ borderRadius: 9999 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
      />
    ) : null

  return (
    <nav
      aria-label="Menu chính"
      className={cn('hd-glass items-center rounded-full px-2 py-1', className)}
      onMouseLeave={() => setHover(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(null)
      }}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
          onMouseEnter={() => setHover(link.href)}
          onFocus={() => setHover(link.href)}
          className={cn('hd-link', FOCUS)}
        >
          {pill(link.href)}
          <span className="hd-label">{link.label}</span>
        </Link>
      ))}
      {/* Trang thông tin chung (Giới thiệu, Công ty, Cẩm nang…) gom vào một mục */}
      <ExploreMenu
        current={exploreActive}
        pill={pill(EXPLORE_KEY)}
        onHover={(h) => setHover(h ? EXPLORE_KEY : null)}
      />
    </nav>
  )
}
