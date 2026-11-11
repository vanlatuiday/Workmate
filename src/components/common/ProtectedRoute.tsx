import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { ROLE_AREAS } from '@constants/roles'
import type { UserRole } from '@/types'
import { BTN_ACCENT, BTN_SECONDARY } from '@utils/ui'

interface Props {
  role: UserRole
}

export default function ProtectedRoute({ role }: Props) {
  const { user } = useAuthStore()
  const location = useLocation()

  // Chưa đăng nhập → sang đăng nhập, nhớ trang đang mở để quay lại sau
  if (!user) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname + location.search }} />
  }

  // Sai vai trò → giải thích thay vì đẩy về trang chủ không lời
  if (user.role !== role) {
    const own = ROLE_AREAS[user.role]
    return (
      <div className="theme-ivory flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-medium md:text-3xl">Trang này dành cho {ROLE_AREAS[role].roleLabel}</h1>
          <p className="mt-3 text-page-muted">
            Bạn đang đăng nhập với vai trò {own.roleLabel}. Đăng xuất rồi đăng nhập tài khoản khác nếu muốn xem trang này.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={own.home}
              className={BTN_ACCENT}
            >
              Về {own.label.toLowerCase()}
            </Link>
            <Link
              to="/"
              className={BTN_SECONDARY}
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
