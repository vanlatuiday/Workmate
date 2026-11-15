import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { MenuItem } from '@components/layout/MenuOverlay'
import ExploreMenu, { EXPLORE_ITEMS } from '@components/layout/ExploreMenu'

const EXPLORE_KEY = '__explore'

/**
 * Menu giữa trong viên kính (không viền). Viên nền "active" chỉ nằm sau trang đang mở;
 * rê chuột vào link khác thì link đó chỉ sáng lên (chủ dự án 2026-11-15), viên không trượt theo.
 */
export default function HeaderNav({ links, className }: { links: MenuItem[]; className?: string }) {
  const { pathname } = useLocation()
  const reduced = useReducedMotion()

  const exploreActive = EXPLORE_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  const activeKey = links.find((l) => l.href === pathname)?.href ?? (exploreActive ? EXPLORE_KEY : null)
  const target = activeKey

  const pill = (key: string) =>
    target === key ? (
      <motion.span
        layoutId="hd-pill"
        aria-hidden="true"
        className="hd-pill"
        style={{ borderRadius: 9999 }}
        // Đổi trang: viên active trượt mượt sang mục mới, 0,4s (chủ dự án 2026-11-16)
        transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      />
    ) : null

  return (
    <nav
      aria-label="Menu chính"
      className={cn('hd-glass items-center rounded-full px-2 py-1', className)}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          aria-current={pathname === link.href ? 'page' : undefined}
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
      />
    </nav>
  )
}
