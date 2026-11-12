// Trang 404 — đường dẫn không khớp tuyến nào. Nằm trong PublicLayout.
import { Link, useLocation } from 'react-router-dom'
import FadeIn from '@components/motion/FadeIn'
import { useAuthStore } from '@context/authStore'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { suggestRoutes } from '@utils/routeSuggest'
import { BTN_ACCENT, BTN_SECONDARY } from '@utils/ui'

export default function NotFoundPage() {
  const { pathname } = useLocation()
  const role = useAuthStore((s) => s.user?.role)
  const suggestions = suggestRoutes(pathname, role)
  // Cắt đường dẫn quá dài để không phá bố cục
  const shown = pathname.length > 80 ? `${pathname.slice(0, 80)}…` : pathname

  return (
    <section className="shell py-section-sm">
      <FadeIn>
        <p className="eyebrow text-page-muted">
          <span className="h-px w-8 bg-page-line" aria-hidden="true" />
          Lỗi 404
        </p>
        <h1 className="mt-6 max-w-[22ch] font-display text-display-sm font-semibold text-page-fg">
          Không tìm thấy trang này
        </h1>
        <p
          title={pathname}
          className="mt-5 max-w-full truncate rounded-control border border-page-line bg-page-surface px-3 py-2 font-mono text-sm tabular-nums text-page-muted sm:inline-block sm:max-w-xl"
        >
          {shown}
        </p>
      </FadeIn>

      <FadeIn delay={80} className="mt-12">
        <h2 className="font-display text-xl font-semibold text-page-fg">Có phải bạn muốn tìm:</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {suggestions.map((r) => (
            <li key={r.to} className="max-w-full">
              <Link
                to={r.to}
                className={cn(
                  'inline-flex max-w-full flex-col rounded-card border border-page-line px-4 py-3 transition-colors hover:border-page-fg',
                  FOCUS,
                )}
              >
                <span className="text-sm font-medium text-page-fg">{r.label}</span>
                <span className="truncate text-xs tabular-nums text-page-muted">{r.to}</span>
              </Link>
            </li>
          ))}
        </ul>
      </FadeIn>

      <FadeIn delay={160} className="mt-12 flex flex-wrap gap-3">
        <Link to="/" className={BTN_ACCENT}>Về trang chủ</Link>
        <Link to="/viec-lam" className={BTN_SECONDARY}>Xem việc làm</Link>
      </FadeIn>
    </section>
  )
}
